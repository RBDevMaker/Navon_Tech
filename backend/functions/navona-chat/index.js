const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Claude 3.5 Sonnet on Bedrock (Messages API). Override via env if needed.
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20240620-v1:0';

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
};

// ---- System prompts -------------------------------------------------------

const PUBLIC_SYSTEM = `You are Navona, the friendly AI assistant for Navon Technologies, a technology and government-contracting company.
Greet visitors warmly, introduce yourself by name, and let them know you are here to answer their questions.
Help with: what Navon Technologies does, services and capabilities, career and job openings, and how to get in contact.
Keep answers concise, professional, and welcoming. If you do not know a specific detail (like a current job opening or internal data), say so and point them to careers@navontech.com or the contact form.
Never invent employee names, salaries, or confidential company information. You only have public knowledge.`;

const PORTAL_SYSTEM = `You are Navona, an AI recruiting assistant inside the Navon Technologies employee portal, used only by Security-level staff.
Your job: given a job description or set of requirements, find the best-fitting people from TWO separate data sets provided to you:
  1. EMPLOYEES — the internal employee directory (current staff).
  2. CANDIDATES — resumes on file in the ATS (external candidates).
Evaluate fit based on: certifications, areas of expertise/skills, job titles, and qualifications relative to the requirements.

You MUST respond with a single valid JSON object and nothing else, in this exact shape:
{
  "summary": "1-2 sentence plain-language overview of what you looked for",
  "employeeMatches": [
    { "name": "", "title": "", "score": 0-100, "reasons": "why they fit (certs, skills, titles)" }
  ],
  "candidateMatches": [
    { "name": "", "position": "", "score": 0-100, "reasons": "why they fit (certs, skills, titles)" }
  ],
  "followUp": "optional short suggestion or clarifying question"
}
Rank each list by score, highest first. Only include people with a plausible fit (score >= 40). If a list has no good matches, return an empty array for it. Do not invent people who are not in the provided data. Keep reasons brief and specific.`;

// ---- Helpers --------------------------------------------------------------

function trimList(list, max) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, max);
}

// Reduce employee records to the fields useful for matching (avoid sending PII we don't need)
function slimEmployees(employees) {
    return trimList(employees, 400).map(e => ({
        name: e.name || '',
        title: e.title || '',
        department: e.department || '',
        certifications: e.certifications || e.certs || '',
        skills: e.skills || e.expertise || '',
        clearance: e.clearance || e.clearanceLevel || '',
        contractAssignment: e.contractAssignment || '',
        experience: e.experience || ''
    }));
}

function slimCandidates(candidates) {
    return trimList(candidates, 400).map(c => ({
        name: c.candidateName || c.name || '',
        position: c.position || '',
        department: c.department || '',
        stage: c.stage || '',
        certifications: c.certifications || '',
        skills: c.skills || '',
        experience: c.experience || '',
        notes: c.notes || ''
    }));
}

async function invokeClaude({ system, messages, maxTokens = 1500 }) {
    const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: maxTokens,
        system,
        messages
    };
    const command = new InvokeModelCommand({
        modelId: MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
    });
    const response = await bedrock.send(command);
    const decoded = JSON.parse(Buffer.from(response.body).toString('utf-8'));
    const text = (decoded.content || []).map(c => c.text || '').join('').trim();
    return text;
}

function safeParseJson(text) {
    if (!text) return null;
    // Strip code fences if the model wrapped the JSON
    let t = text.trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1].trim();
    // Grab the outermost object
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    try {
        return JSON.parse(t.slice(start, end + 1));
    } catch (e) {
        return null;
    }
}

// ---- Handler --------------------------------------------------------------

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const mode = body.mode === 'portal' ? 'portal' : 'public';

        // ---- Portal mode: candidate/employee matching ----
        if (mode === 'portal') {
            const jobDescription = (body.jobDescription || body.message || '').toString().trim();
            if (!jobDescription) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'A job description or set of requirements is required.' })
                };
            }

            const employees = slimEmployees(body.employees || []);
            const candidates = slimCandidates(body.candidates || []);

            const userContent = `JOB DESCRIPTION / REQUIREMENTS:
${jobDescription}

EMPLOYEES (internal directory):
${JSON.stringify(employees)}

CANDIDATES (resumes on file):
${JSON.stringify(candidates)}

Return the JSON object as specified. Keep employeeMatches and candidateMatches as separate lists.`;

            const text = await invokeClaude({
                system: PORTAL_SYSTEM,
                messages: [{ role: 'user', content: userContent }],
                maxTokens: 2000
            });

            const parsed = safeParseJson(text);
            if (!parsed) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        summary: 'I had trouble formatting the results. Here is my raw analysis.',
                        employeeMatches: [],
                        candidateMatches: [],
                        followUp: text
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    summary: parsed.summary || '',
                    employeeMatches: Array.isArray(parsed.employeeMatches) ? parsed.employeeMatches : [],
                    candidateMatches: Array.isArray(parsed.candidateMatches) ? parsed.candidateMatches : [],
                    followUp: parsed.followUp || ''
                })
            };
        }

        // ---- Public mode: general assistant ----
        const message = (body.message || '').toString().trim();
        if (!message) {
            // No message yet -> return a greeting
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    reply: "Hi, I'm Navona, the Navon Technologies assistant. I'm here to answer your questions. How can I help you today?"
                })
            };
        }

        // Include prior turns if the client sends them
        const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
        const messages = [...history, { role: 'user', content: message }];

        const reply = await invokeClaude({
            system: PUBLIC_SYSTEM,
            messages,
            maxTokens: 800
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply: reply || "I'm sorry, I didn't catch that. Could you rephrase?" })
        };

    } catch (error) {
        console.error('Navona error:', error);
        const isAccess = /AccessDenied|not authorized|could not|model/i.test(error.message || '');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Navona is temporarily unavailable.',
                detail: isAccess ? 'Bedrock model access may not be enabled yet.' : (error.message || 'Unknown error')
            })
        };
    }
};
