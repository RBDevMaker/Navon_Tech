const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Extract plain text from an offer letter (base64-encoded DOCX or PDF)
async function extractOfferLetterText(base64Content, fileName) {
    try {
        const buffer = Buffer.from(base64Content, 'base64');
        const ext = (fileName || '').toLowerCase();
        if (ext.endsWith('.docx') || ext.endsWith('.doc')) {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ buffer });
            return result.value || '';
        } else if (ext.endsWith('.pdf')) {
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(buffer);
            return data.text || '';
        }
        // Fallback: treat as plain text
        return buffer.toString('utf-8');
    } catch (err) {
        console.error('Offer letter text extraction failed:', err);
        return '';
    }
}

// Parse structured fields from offer letter text
function parseOfferLetter(text, candidateName) {
    const clean = (text || '').replace(/\r/g, '').replace(/\u00a0/g, ' ');
    const get = (re) => { const m = clean.match(re); return m ? m[1].trim().replace(/\s+/g, ' ') : ''; };
    
    const title = get(/offer of employment with Navon Technologies as an?\s+([^.\n]+?)[.\n]/i);
    const startDate = get(/start date will be\s+([^.\n]+?)[.\n]/i);
    const annualSalary = get(/\$\s*([\d,]+(?:\.\d{2})?)\s*(?:annually|per year|\/year|annual)/i);
    const hourlyRate = get(/hourly rate of\s*\$\s*([\d,]+(?:\.\d{2})?)/i);
    const classification = get(/classified as\s+(exempt|non-exempt|nonexempt)/i);
    const payFrequency = get(/paid on an?\s+([a-z-]+)\s+basis/i);
    const ptoWeeks = get(/([\d.]+)\s*weeks?\s+of\s+PTO/i);
    const holidays = get(/(\d+)\s+Federal holidays/i);
    const isFullTime = /full[-\s]?time employee/i.test(clean);
    const isContractor = /contractor|1099|independent contractor/i.test(clean);
    // Address: lines following the candidate name at top
    let address = '';
    if (candidateName) {
        const nameIdx = clean.indexOf(candidateName);
        if (nameIdx !== -1) {
            const after = clean.substring(nameIdx + candidateName.length, nameIdx + candidateName.length + 200);
            const addrMatch = after.match(/([\dA-Za-z][^\n]*\n[^\n]*,\s*[A-Z]{2}\s*\d{5})/);
            if (addrMatch) address = addrMatch[1].replace(/\n/g, ', ').replace(/\s+/g, ' ').trim();
        }
    }
    
    // Benefits detection
    const benefits = [];
    if (/medical/i.test(clean)) benefits.push('Medical');
    if (/dental/i.test(clean)) benefits.push('Dental');
    if (/vision/i.test(clean)) benefits.push('Vision');
    if (/401\s*\(?k\)?/i.test(clean)) benefits.push('401(k)');
    if (/life insurance/i.test(clean)) benefits.push('Life');
    if (/short[-\s]?term.*disability|long[-\s]?term.*disability|std|ltd/i.test(clean)) benefits.push('STD/LTD');
    if (/employee assistance|eap/i.test(clean)) benefits.push('EAP');
    if (/\bpto\b|paid time off/i.test(clean)) benefits.push('PTO');
    
    return {
        title,
        startDate,
        annualSalary: annualSalary ? `$${annualSalary}` : '',
        hourlyRate: hourlyRate ? `$${hourlyRate}` : '',
        classification: classification ? (classification.charAt(0).toUpperCase() + classification.slice(1).toLowerCase()) : '',
        payFrequency: payFrequency ? (payFrequency.charAt(0).toUpperCase() + payFrequency.slice(1).toLowerCase()) : '',
        employmentType: isContractor ? 'Contractor' : (isFullTime ? 'Full-Time Employee' : ''),
        ptoWeeks: ptoWeeks ? `${ptoWeeks} weeks` : '',
        holidays: holidays ? `${holidays} Federal holidays` : '',
        benefits: benefits.length ? benefits.join(', ') : '',
        address
    };
}

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
};

// Security: Input validation and sanitization
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    // Remove potential XSS and SQL injection attempts
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
        .substring(0, 1000); // Limit length
};

const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
};

const validateFileName = (fileName) => {
    // Only allow safe file extensions
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return allowedExtensions.includes(ext);
};

// Security: Rate limiting using DynamoDB
const checkRateLimit = async (email, ipAddress) => {
    const tableName = process.env.RATE_LIMIT_TABLE || 'JobApplicationRateLimit';
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    try {
        // Query submissions from this email in the last hour
        const queryParams = {
            TableName: tableName,
            KeyConditionExpression: 'email = :email AND #ts > :oneHourAgo',
            ExpressionAttributeNames: {
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':email': { S: email },
                ':oneHourAgo': { N: oneHourAgo.toString() }
            }
        };
        
        const result = await dynamoClient.send(new QueryCommand(queryParams));
        
        // Allow max 3 submissions per hour per email
        if (result.Items && result.Items.length >= 3) {
            return false;
        }
        
        // Record this submission
        const putParams = {
            TableName: tableName,
            Item: {
                email: { S: email },
                timestamp: { N: now.toString() },
                ipAddress: { S: ipAddress || 'unknown' },
                ttl: { N: Math.floor((now + (24 * 60 * 60 * 1000)) / 1000).toString() } // 24 hour TTL
            }
        };
        
        await dynamoClient.send(new PutItemCommand(putParams));
        return true;
    } catch (error) {
        console.warn('Rate limit check error (allowing request):', error.message);
        // If rate limiting fails (table doesn't exist, etc.), allow the request (fail open)
        return true;
    }
};

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: ''
        };
    }

    try {
        // Parse the multipart form data
        const body = JSON.parse(event.body);

        // Handle login notification for monitored users
        if (body.type === 'login-notification') {
            const { userEmail, loginTime, notifyEmail } = body;
            const displayTime = new Date(loginTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
            const isUserSelf = notifyEmail.toLowerCase() === userEmail.toLowerCase();
            
            const subject = isUserSelf 
                ? `✅ Login Confirmation — Navon Technologies Portal`
                : `🔔 Login Alert: ${userEmail} signed in`;
            
            const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
                    <h1 style="color:#d4af37;margin:0;font-size:24px;">NAVON TECHNOLOGIES</h1>
                    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:13px;letter-spacing:2px;">LOGIN NOTIFICATION</p>
                </div>
                <div style="background:#d4af37;height:4px;"></div>
                <div style="padding:30px;background:white;border:1px solid #e2e8f0;">
                    <h2 style="color:#1e3a8a;margin:0 0 16px;">${isUserSelf ? '✅ You signed in successfully' : `🔔 ${userEmail} signed in`}</h2>
                    <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px;">
                        <p style="margin:4px 0;font-size:14px;"><strong>User:</strong> ${userEmail}</p>
                        <p style="margin:4px 0;font-size:14px;"><strong>Time:</strong> ${displayTime}</p>
                    </div>
                    <p style="color:#64748b;font-size:13px;">${isUserSelf ? 'This confirms your successful login to the Navon Technologies Employee Portal.' : 'This is an automated notification that the above user has signed in to the Employee Portal.'}</p>
                    ${!isUserSelf ? '<p style="color:#64748b;font-size:13px;">If this was unexpected, please review access immediately.</p>' : ''}
                </div>
                <div style="background:#1e293b;padding:20px;text-align:center;border-radius:0 0 12px 12px;">
                    <p style="color:#d4af37;font-size:12px;margin:0;font-weight:600;">NAVON TECHNOLOGIES</p>
                    <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Leesburg, Virginia | navontech.com</p>
                </div>
            </div>`;

            await sesClient.send(new SendEmailCommand({
                Source: 'noreply@navontech.com',
                Destination: { ToAddresses: [notifyEmail] },
                Message: {
                    Subject: { Data: subject, Charset: 'UTF-8' },
                    Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } }
                }
            }));

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: 'Login notification sent' })
            };
        }

        // Handle favorite resume review reminder to career distribution group
        if (body.type === 'favorite-resume-review') {
            const { favorites, notifyEmail } = body;
            const favList = Array.isArray(favorites) ? favorites : [];
            
            const rows = favList.map(f => `
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:10px 14px;font-weight:600;color:#1e293b;">${f.candidateName || 'Unknown'}</td>
                    <td style="padding:10px 14px;color:#475569;">${f.position || 'Not specified'}</td>
                    <td style="padding:10px 14px;color:#475569;">${f.department || 'Not specified'}</td>
                    <td style="padding:10px 14px;color:#94a3b8;">${f.stage || 'New'}</td>
                </tr>`).join('');
            
            const subject = `⭐ Favorite Candidates — 30-Day Review (${favList.length})`;
            const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;">
                <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
                    <h1 style="color:#d4af37;margin:0;font-size:24px;">NAVON TECHNOLOGIES</h1>
                    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:13px;letter-spacing:2px;">FAVORITE CANDIDATES REVIEW</p>
                </div>
                <div style="background:#d4af37;height:4px;"></div>
                <div style="padding:30px;background:white;border:1px solid #e2e8f0;">
                    <h2 style="color:#1e3a8a;margin:0 0 16px;">⭐ 30-Day Favorite Candidates Review</h2>
                    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px;">The following ${favList.length} candidate(s) have been marked as favorites in the ATS and are due for review. Please revisit their profiles to determine next steps.</p>
                    <table style="width:100%;border-collapse:collapse;font-size:13px;border:2px solid #e2e8f0;border-radius:8px;">
                        <thead>
                            <tr style="background:#f8fafc;border-bottom:2px solid #d4af37;">
                                <th style="padding:10px 14px;text-align:left;color:#1e3a8a;">Candidate</th>
                                <th style="padding:10px 14px;text-align:left;color:#1e3a8a;">Position</th>
                                <th style="padding:10px 14px;text-align:left;color:#1e3a8a;">Department</th>
                                <th style="padding:10px 14px;text-align:left;color:#1e3a8a;">Stage</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div style="background:#eff6ff;border:2px solid #93c5fd;border-radius:8px;padding:16px 20px;margin-top:24px;">
                        <h3 style="color:#1e40af;font-size:15px;margin:0 0 10px;">📋 Action Items</h3>
                        <ol style="color:#1e40af;font-size:14px;line-height:1.9;margin:0;padding-left:20px;">
                            <li><strong>Review each resume</strong> in the ATS to reassess fit and current openings.</li>
                            <li><strong>Follow up with the candidate</strong> for any updates to their availability, experience, or resume.</li>
                            <li><strong>Let them know</strong> we are still looking for the best opportunity for them and value their interest in Navon Technologies.</li>
                        </ol>
                    </div>
                    <div style="text-align:center;margin-top:24px;">
                        <a href="https://navontech.com/#resumes" style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;text-decoration:none;padding:12px 30px;border-radius:8px;font-size:15px;font-weight:700;">Review Resume in ATS →</a>
                    </div>
                </div>
                <div style="background:#1e293b;padding:20px;text-align:center;border-radius:0 0 12px 12px;">
                    <p style="color:#d4af37;font-size:12px;margin:0;font-weight:600;">NAVON TECHNOLOGIES</p>
                    <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Leesburg, Virginia | navontech.com</p>
                </div>
            </div>`;

            await sesClient.send(new SendEmailCommand({
                Source: 'careers@navontech.com',
                Destination: { ToAddresses: [notifyEmail || 'careers@navontech.com'] },
                Message: {
                    Subject: { Data: subject, Charset: 'UTF-8' },
                    Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } }
                }
            }));

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: 'Favorite resume review sent' })
            };
        }

        // Handle new hire onboarding: parse offer letter, build summary, email Rachelle & Yahvinah
        if (body.type === 'new-hire-onboarding-form') {
            const { candidateName, offerLetterContent, offerLetterFileName, offerLetterUrl, resumeUrl } = body;

            // Extract and parse offer letter text
            let parsed = {};
            if (offerLetterContent) {
                const text = await extractOfferLetterText(offerLetterContent, offerLetterFileName || '');
                parsed = parseOfferLetter(text, candidateName);
            }

            const row = (label, value, hint) => `
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:11px 16px;font-weight:600;color:#334155;width:190px;">${label}</td>
                    <td style="padding:11px 16px;color:${value ? '#1e293b' : '#94a3b8'};">${value || '<em>Not found — please verify</em>'}${hint ? `<br><span style="font-size:12px;color:#94a3b8;">${hint}</span>` : ''}</td>
                </tr>`;
            const sectionHead = (t) => `<tr style="background:#f8fafc;"><td colspan="2" style="padding:12px 16px;font-weight:700;color:#1e3a8a;font-size:15px;border-bottom:2px solid #d4af37;border-top:2px solid #e2e8f0;">${t}</td></tr>`;

            const subject = `🎉 New Hire Onboarding Summary — ${candidateName}`;
            const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;">
                <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
                    <h1 style="color:#d4af37;margin:0;font-size:24px;">NAVON TECHNOLOGIES</h1>
                    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:13px;letter-spacing:2px;">NEW HIRE ONBOARDING SUMMARY</p>
                </div>
                <div style="background:#d4af37;height:4px;"></div>
                <div style="padding:30px;background:white;border:1px solid #e2e8f0;">
                    <h2 style="color:#1e3a8a;margin:0 0 8px;">🎉 New Hire: ${candidateName}</h2>
                    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px;">The following information was extracted from the offer letter${resumeUrl ? ' and candidate record' : ''}. Please review and proceed with Rippling onboarding and company email setup.</p>
                    <table style="width:100%;border-collapse:collapse;border:2px solid #e2e8f0;border-radius:8px;">
                        <tr style="background:#f8fafc;"><td colspan="2" style="padding:12px 16px;font-weight:700;color:#1e3a8a;font-size:15px;border-bottom:2px solid #d4af37;">Employee Information</td></tr>
                        ${row('Full Name', candidateName)}
                        ${row('Address', parsed.address)}
                        ${row('Start Date', parsed.startDate)}
                        ${sectionHead('Position &amp; Compensation')}
                        ${row('Title / Position', parsed.title)}
                        ${row('Annual Salary', parsed.annualSalary)}
                        ${row('Hourly Rate', parsed.hourlyRate)}
                        ${row('Classification', parsed.classification)}
                        ${row('Employment Type', parsed.employmentType)}
                        ${row('Pay Frequency', parsed.payFrequency)}
                        ${sectionHead('Benefits &amp; Leave')}
                        ${row('Benefits Package', parsed.benefits)}
                        ${row('PTO', parsed.ptoWeeks)}
                        ${row('Holidays', parsed.holidays)}
                    </table>
                    ${(offerLetterUrl || resumeUrl) ? `<div style="text-align:center;margin-top:24px;">
                        ${offerLetterUrl ? `<a href="${offerLetterUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700;margin:4px;">📋 View Offer Letter</a>` : ''}
                        ${resumeUrl ? `<a href="${resumeUrl}" style="display:inline-block;background:#059669;color:white;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700;margin:4px;">📄 View Resume</a>` : ''}
                    </div>` : ''}
                    <div style="background:#fef3c7;border:2px solid #fbbf24;border-radius:8px;padding:16px;margin-top:24px;">
                        <p style="color:#92400e;font-size:13px;margin:0;line-height:1.7;"><strong>⚠️ Please verify all extracted details against the offer letter before entering into Rippling.</strong> Fields not found are marked accordingly.</p>
                    </div>
                </div>
                <div style="background:#1e293b;padding:20px;text-align:center;border-radius:0 0 12px 12px;">
                    <p style="color:#d4af37;font-size:12px;margin:0;font-weight:600;">NAVON TECHNOLOGIES</p>
                    <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Confidential — For internal use only</p>
                </div>
            </div>`;

            for (const hrEmail of ['yahvinah.bryant@navontech.com', 'rachelle.briscoe@navontech.com']) {
                await sesClient.send(new SendEmailCommand({
                    Source: 'hr@navontech.com',
                    Destination: { ToAddresses: [hrEmail] },
                    Message: {
                        Subject: { Data: subject, Charset: 'UTF-8' },
                        Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } }
                    }
                }));
            }

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: 'Onboarding summary sent to Rachelle and Yahvinah', extracted: parsed })
            };
        }

        // Handle Cleared Candidate Summary notification
        if (body.type === 'candidate-summary-notification') {
            const { candidateName, clearanceLevel, recruiter, conversationDate, summaryUrl, notifyEmail } = body;
            
            const subject = `📝 Cleared Candidate Summary for Review — ${candidateName}`;
            const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
                    <h1 style="color:#d4af37;margin:0;font-size:24px;">NAVON TECHNOLOGIES</h1>
                    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:13px;letter-spacing:2px;">CLEARED CANDIDATE SUMMARY FOR REVIEW</p>
                </div>
                <div style="background:#d4af37;height:4px;"></div>
                <div style="padding:30px;background:white;border:1px solid #e2e8f0;">
                    <h2 style="color:#1e3a8a;margin:0 0 16px;">📝 New Cleared Candidate Summary</h2>
                    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px;">A new Cleared Candidate Summary has been submitted and is ready for your review in the Compliance & Security section of the Employee Portal.</p>
                    <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px;">
                        <p style="margin:4px 0;font-size:14px;"><strong>Candidate Name:</strong> ${candidateName}</p>
                        <p style="margin:4px 0;font-size:14px;"><strong>Clearance Level:</strong> ${clearanceLevel || 'Not specified'}</p>
                        <p style="margin:4px 0;font-size:14px;"><strong>Recruiter:</strong> ${recruiter || 'Not specified'}</p>
                        <p style="margin:4px 0;font-size:14px;"><strong>Date of Conversation:</strong> ${conversationDate || 'Not specified'}</p>
                    </div>
                    <div style="text-align:center;margin-bottom:12px;">
                        ${summaryUrl ? `<a href="${summaryUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;text-decoration:none;padding:12px 30px;border-radius:8px;font-size:15px;font-weight:700;">📝 Open Summary Document →</a>` : ''}
                    </div>
                    <div style="text-align:center;margin-bottom:12px;">
                        <a href="https://navontech.com/#compliancesecurity?candidate=${encodeURIComponent(candidateName)}" style="display:inline-block;background:#475569;color:white;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:700;">🛡️ View in Portal</a>
                    </div>
                    <div style="text-align:center;margin-bottom:20px;">
                        <a href="https://navontech.com/#resumes?candidate=${encodeURIComponent(candidateName)}" style="display:inline-block;background:#059669;color:white;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:700;margin-right:8px;">📄 View Resume</a>
                        <a href="https://navontech.com/#resumes?candidate=${encodeURIComponent(candidateName)}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:700;">👤 View in ATS</a>
                    </div>
                    <p style="color:#64748b;font-size:13px;">Navigate to Compliance & Security to view, download, or print the full summary.</p>
                </div>
                <div style="background:#1e293b;padding:20px;text-align:center;border-radius:0 0 12px 12px;">
                    <p style="color:#d4af37;font-size:12px;margin:0;font-weight:600;">NAVON TECHNOLOGIES</p>
                    <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Leesburg, Virginia | navontech.com</p>
                </div>
            </div>`;

            await sesClient.send(new SendEmailCommand({
                Source: 'hr@navontech.com',
                Destination: { ToAddresses: [notifyEmail] },
                Message: {
                    Subject: { Data: subject, Charset: 'UTF-8' },
                    Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } }
                }
            }));

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: 'Candidate summary notification sent successfully' })
            };
        }

        // Handle referral confirmation to referee
        if (body.type === 'referral-confirmation') {
            const { referrerName, referrerEmail, candidateName, position } = body;
            
            const subject = `✅ Thank You for Your Referral — ${candidateName}`;
            const htmlBody = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <div style="background:#1e3a8a;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
                        <h2 style="color:#d4af37;margin:0;">NAVON TECHNOLOGIES</h2>
                        <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;font-size:12px;">Employee Referral Program</p>
                    </div>
                    <div style="background:#f8fafc;padding:24px;border:2px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
                        <h3 style="color:#1e3a8a;margin:0 0 16px;">Thank You, ${referrerName}!</h3>
                        <p style="color:#334155;font-size:14px;line-height:1.6;">
                            Your referral for <strong>${candidateName}</strong>${position ? ` for the <strong>${position}</strong> position` : ''} has been received and is now under review by our HR team.
                        </p>
                        <p style="color:#334155;font-size:14px;line-height:1.6;">
                            We appreciate you helping us find great talent. You will receive updates as the candidate progresses through our hiring process.
                        </p>
                        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;margin:16px 0;">
                            <p style="color:#166534;font-size:13px;margin:0;">💡 <strong>Reminder:</strong> Eligible referral bonuses are paid at 90 days and 180 days after the candidate's start date.</p>
                        </div>
                        <p style="color:#94a3b8;font-size:12px;margin:20px 0 0;border-top:1px solid #e2e8f0;padding-top:12px;">
                            Navon Technologies | Leesburg, Virginia
                        </p>
                    </div>
                </div>
            `;
            
            await sesClient.send(new SendEmailCommand({
                Destination: { ToAddresses: [referrerEmail] },
                Message: {
                    Subject: { Data: subject },
                    Body: { Html: { Data: htmlBody } }
                },
                Source: 'noreply@navontech.com'
            }));
            
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: 'Referral confirmation sent to referee' })
            };
        }

        // Handle stage change notifications (all stage moves)
        if (body.type === 'stage-change-notification') {
            const { candidateName, position, oldStage, newStage, hiredDate, notifyEmail } = body;
            
            const stageEmoji = { 'New': '📥', 'Screening': '🔍', 'Interview': '📝', 'Offer': '✅', 'Pending': '⏳', 'Hired': '🎉', 'Rejected': '❌', 'Archived': '📦' };
            const emoji = stageEmoji[newStage] || '📋';
            
            const subject = `${emoji} ATS Update: ${candidateName} moved to ${newStage}`;
            const htmlBody = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <div style="background:#1e3a8a;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
                        <h2 style="color:#d4af37;margin:0;">NAVON TECHNOLOGIES</h2>
                        <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;font-size:12px;">Application Tracking System</p>
                    </div>
                    <div style="background:#f8fafc;padding:24px;border:2px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
                        <h3 style="color:#1e3a8a;margin:0 0 16px;">${emoji} Stage Change Notification</h3>
                        <table style="width:100%;font-size:14px;border-collapse:collapse;">
                            <tr><td style="padding:8px 0;color:#64748b;width:130px;"><strong>Candidate:</strong></td><td style="padding:8px 0;color:#1e293b;">${candidateName}</td></tr>
                            <tr><td style="padding:8px 0;color:#64748b;"><strong>Position:</strong></td><td style="padding:8px 0;color:#1e293b;">${position}</td></tr>
                            <tr><td style="padding:8px 0;color:#64748b;"><strong>Previous Stage:</strong></td><td style="padding:8px 0;color:#1e293b;">${oldStage || 'N/A'}</td></tr>
                            <tr><td style="padding:8px 0;color:#64748b;"><strong>New Stage:</strong></td><td style="padding:8px 0;color:#1e293b;font-weight:700;">${newStage}</td></tr>
                            ${hiredDate ? `<tr><td style="padding:8px 0;color:#64748b;"><strong>Start Date:</strong></td><td style="padding:8px 0;color:#1e293b;">${hiredDate}</td></tr>` : ''}
                        </table>
                        <p style="color:#94a3b8;font-size:12px;margin:20px 0 0;border-top:1px solid #e2e8f0;padding-top:12px;">
                            <a href="https://navontech.com/#resumes?candidate=${encodeURIComponent(candidateName)}" style="color:#3b82f6;font-weight:600;text-decoration:none;">View ${candidateName} in ATS →</a>
                        </p>
                    </div>
                </div>
            `;
            
            await sesClient.send(new SendEmailCommand({
                Destination: { ToAddresses: [notifyEmail] },
                Message: {
                    Subject: { Data: subject },
                    Body: { Html: { Data: htmlBody } }
                },
                Source: 'noreply@navontech.com'
            }));
            
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: 'Stage change notification sent' })
            };
        }

        // Handle referral notifications
        if (body.type === 'referral-stage-notification' || body.type === 'referral-bonus-notification') {
            const { candidateName, position, referredBy, notifyEmail, oldStage, newStage, milestone, action, hiredDate } = body;
            
            let subject, htmlBody;
            
            if (body.type === 'referral-bonus-notification') {
                const is180 = milestone === '180 days';
                subject = is180 
                    ? `💸💸 Referral Bonus Final Payout Due — ${candidateName}`
                    : `💸 Referral Bonus Half Payment Due — ${candidateName}`;
                htmlBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                    <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
                        <h1 style="color:#d4af37;margin:0;font-size:24px;">NAVON TECHNOLOGIES</h1>
                        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:13px;letter-spacing:2px;">REFERRAL BONUS REMINDER</p>
                    </div>
                    <div style="background:#d4af37;height:4px;"></div>
                    <div style="padding:30px;background:white;border:1px solid #e2e8f0;">
                        <h2 style="color:#1e3a8a;margin:0 0 16px;">${is180 ? '💸💸 180-Day Milestone Reached' : '💸 90-Day Milestone Reached'}</h2>
                        <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:8px;padding:20px;margin-bottom:20px;">
                            <p style="margin:4px 0;"><strong>Hired Employee:</strong> ${candidateName}</p>
                            <p style="margin:4px 0;"><strong>Position:</strong> ${position}</p>
                            <p style="margin:4px 0;"><strong>Referred By:</strong> ${referredBy}</p>
                            <p style="margin:4px 0;"><strong>Hire Date:</strong> ${hiredDate || 'N/A'}</p>
                            <p style="margin:4px 0;"><strong>Milestone:</strong> ${milestone} completed</p>
                        </div>
                        <div style="background:${is180 ? '#dcfce7;border:2px solid #16a34a' : '#fef3c7;border:2px solid #fbbf24'};border-radius:8px;padding:20px;margin-bottom:20px;">
                            <h3 style="color:${is180 ? '#166534' : '#92400e'};margin:0 0 8px;">⚡ Action Required</h3>
                            <p style="color:${is180 ? '#166534' : '#92400e'};margin:0;">${action || (is180 ? 'Pay FULL REMAINING BALANCE of referral bonus to ' + referredBy + ' via payroll.' : 'Pay HALF of referral bonus to ' + referredBy + ' via payroll.')}</p>
                        </div>
                        <p style="color:#64748b;font-size:13px;">Automated reminder from Navon Technologies Employee Portal.</p>
                    </div>
                    <div style="background:#1e293b;padding:20px;text-align:center;border-radius:0 0 12px 12px;">
                        <p style="color:#d4af37;font-size:12px;margin:0;font-weight:600;">NAVON TECHNOLOGIES</p>
                        <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Leesburg, Virginia | navontech.com</p>
                    </div>
                </div>`;
            } else {
                subject = `Referral Stage Update: ${candidateName} — ${newStage}`;
                htmlBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                    <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
                        <h1 style="color:#d4af37;margin:0;font-size:24px;">NAVON TECHNOLOGIES</h1>
                        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:13px;letter-spacing:2px;">REFERRAL STATUS UPDATE</p>
                    </div>
                    <div style="background:#d4af37;height:4px;"></div>
                    <div style="padding:30px;background:white;border:1px solid #e2e8f0;">
                        <h2 style="color:#1e3a8a;margin:0 0 16px;">📊 Referral Stage Changed</h2>
                        <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px;">
                            <p style="margin:4px 0;"><strong>Candidate:</strong> ${candidateName}</p>
                            <p style="margin:4px 0;"><strong>Position:</strong> ${position}</p>
                            <p style="margin:4px 0;"><strong>Referred By:</strong> ${referredBy}</p>
                            <p style="margin:4px 0;"><strong>Previous Stage:</strong> ${oldStage || 'N/A'}</p>
                            <p style="margin:4px 0;"><strong>New Stage:</strong> ${newStage}</p>
                        </div>
                        <p style="color:#64748b;font-size:13px;">Automated notification from Navon Technologies Employee Portal.</p>
                    </div>
                    <div style="background:#1e293b;padding:20px;text-align:center;border-radius:0 0 12px 12px;">
                        <p style="color:#d4af37;font-size:12px;margin:0;font-weight:600;">NAVON TECHNOLOGIES</p>
                        <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Leesburg, Virginia | navontech.com</p>
                    </div>
                </div>`;
            }

            await sesClient.send(new SendEmailCommand({
                Source: 'hr@navontech.com',
                Destination: { ToAddresses: [notifyEmail] },
                Message: {
                    Subject: { Data: subject, Charset: 'UTF-8' },
                    Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } }
                }
            }));

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: 'Notification sent successfully' })
            };
        }

        const { name, email, position, resumeData, resumeFileName, resumeContentType, recaptchaToken } = body;

        // Security: Validate reCAPTCHA token (if provided)
        if (recaptchaToken) {
            // Note: In production, verify with Google reCAPTCHA API
            // For now, we'll just check it exists
            console.log('reCAPTCHA token received:', recaptchaToken.substring(0, 20) + '...');
        }

        // Security: Get IP address for rate limiting
        const ipAddress = event.requestContext?.identity?.sourceIp || 
                         event.headers?.['X-Forwarded-For']?.split(',')[0] || 
                         'unknown';

        // Security: Input validation and sanitization
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);
        const sanitizedPosition = sanitizeInput(position);

        // Validate required fields (email optional for referrals)
        const isReferral = position && position.startsWith('REFERRAL:');
        if (!sanitizedName || (!sanitizedEmail && !isReferral)) {
            console.warn('Missing required fields', { name: !!name, email: !!email });
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    error: 'Missing required fields',
                    message: 'Name and email are required'
                })
            };
        }

        // Validate name length
        if (sanitizedName.length < 2 || sanitizedName.length > 100) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    error: 'Invalid name',
                    message: 'Name must be between 2 and 100 characters'
                })
            };
        }

        // Validate email format (skip for referrals without candidate email)
        if (sanitizedEmail && !validateEmail(sanitizedEmail)) {
            console.warn('Invalid email format:', sanitizedEmail);
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    error: 'Invalid email format',
                    message: 'Please provide a valid email address'
                })
            };
        }

        // Security: Check rate limiting (optional - only if table exists)
        if (process.env.RATE_LIMIT_TABLE) {
            const rateLimitPassed = await checkRateLimit(sanitizedEmail, ipAddress);
            if (!rateLimitPassed) {
                console.warn('Rate limit exceeded for:', sanitizedEmail, ipAddress);
                return {
                    statusCode: 429,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ 
                        error: 'Too many requests',
                        message: 'You have submitted too many applications. Please try again later.'
                    })
                };
            }
        } else {
            console.log('Rate limiting disabled (no table configured)');
        }

        let resumeUrl = null;
        let s3Key = null;

        // Upload resume to S3 if provided (optional)
        if (resumeData && resumeFileName) {
            // Security: Validate file name and extension
            if (!validateFileName(resumeFileName)) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ 
                        error: 'Invalid file type',
                        message: 'Only PDF, DOC, DOCX, and TXT files are allowed'
                    })
                };
            }

            // Security: Validate file size (5MB max)
            const buffer = Buffer.from(resumeData, 'base64');
            const fileSizeInMB = buffer.length / (1024 * 1024);
            if (fileSizeInMB > 5) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ 
                        error: 'File too large',
                        message: 'Resume file must be less than 5MB'
                    })
                };
            }

            const timestamp = Date.now();
            const sanitizedFileName = resumeFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
            s3Key = `Resumes/${timestamp}-${sanitizedFileName}`;
            
            const uploadParams = {
                Bucket: process.env.S3_BUCKET || 'navon-tech-images',
                Key: s3Key,
                Body: buffer,
                ContentType: resumeContentType || 'application/pdf',
                ServerSideEncryption: 'AES256',
                Metadata: {
                    'applicant-email': sanitizedEmail,
                    'upload-timestamp': timestamp.toString()
                }
            };

            await s3Client.send(new PutObjectCommand(uploadParams));
            resumeUrl = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
            console.log('Resume uploaded successfully:', s3Key);
        }
        
        // Save application to ResumeMetadata table (always, even without resume file)
        try {
            const timestamp = Date.now();
            const resumeId = `resume-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
            const receivedDate = new Date().toISOString();
            
            const resumeMetadata = {
                resumeId,
                receivedDate,
                candidateName: sanitizedName,
                email: sanitizedEmail,
                phone: '', // Not collected in public form
                position: sanitizedPosition,
                department: 'General', // Default department for public applications
                stage: 'New',
                s3Key: s3Key || '', // Empty string if no resume uploaded
                notes: `Applied via public career portal from IP: ${ipAddress}${resumeUrl ? '' : ' (No resume provided)'}`,
                experience: '',
                createdAt: receivedDate,
                updatedAt: receivedDate
            };
            
            await docClient.send(new PutCommand({
                TableName: 'ResumeMetadata',
                Item: resumeMetadata
            }));
            
            console.log('Application saved to ResumeMetadata table:', resumeId);
        } catch (dbError) {
            console.error('Error saving to ResumeMetadata table:', dbError);
            // Don't fail the application if DynamoDB save fails
            // The resume is still in S3 (if uploaded) and email will be sent
        }

        // Send email to HR via SES (application info only, no resume)
        const hrEmailParams = {
            Source: 'hr@navontech.com',
            Destination: {
                ToAddresses: ['hr@navontech.com']
            },
            Message: {
                Subject: {
                    Data: `New Job Application: ${sanitizedPosition || 'General'}`,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: `
                            <html>
                                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                                    <h2 style="color: #d4af37;">New Job Application Received</h2>
                                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <p><strong>Name:</strong> ${sanitizedName}</p>
                                        <p><strong>Email:</strong> <a href="mailto:${sanitizedEmail}">${sanitizedEmail}</a></p>
                                        <p><strong>Position/Skillset:</strong> ${sanitizedPosition || 'Not specified'}</p>
                                        <p><strong>IP Address:</strong> ${ipAddress}</p>
                                    </div>
                                    <p style="color: #64748b; font-size: 0.9em;">
                                        This application was submitted through the Navon Technologies career portal.
                                    </p>
                                </body>
                            </html>
                        `,
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: `New Job Application Received\n\nName: ${sanitizedName}\nEmail: ${sanitizedEmail}\nPosition/Skillset: ${sanitizedPosition || 'Not specified'}\nIP Address: ${ipAddress}\n\nThis application was submitted through the Navon Technologies career portal.`,
                        Charset: 'UTF-8'
                    }
                }
            },
            ReplyToAddresses: sanitizedEmail ? [sanitizedEmail] : ['hr@navontech.com']
        };

        // Send email to Security via SES (with resume)
        const securityEmailParams = {
            Source: 'hr@navontech.com',
            Destination: {
                ToAddresses: ['security@navontech.com']
            },
            Message: {
                Subject: {
                    Data: `New Applicant Resume: ${sanitizedName} - ${sanitizedPosition || 'General'}`,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: `
                            <html>
                                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                                    <h2 style="color: #d4af37;">New Applicant Resume</h2>
                                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <p><strong>Name:</strong> ${sanitizedName}</p>
                                        <p><strong>Email:</strong> <a href="mailto:${sanitizedEmail}">${sanitizedEmail}</a></p>
                                        <p><strong>Position/Skillset:</strong> ${sanitizedPosition || 'Not specified'}</p>
                                        ${resumeUrl ? `<p><strong>Resume:</strong> <a href="${resumeUrl}">Download Resume</a></p>` : '<p><strong>Resume:</strong> Not provided</p>'}
                                    </div>
                                    <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37;">
                                        <p style="margin: 0; font-weight: 600; color: #92400e;">Please reach out to applicant for further steps.</p>
                                    </div>
                                    <p style="color: #64748b; font-size: 0.9em;">
                                        This application was submitted through the Navon Technologies career portal.
                                    </p>
                                </body>
                            </html>
                        `,
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: `New Applicant Resume\n\nName: ${sanitizedName}\nEmail: ${sanitizedEmail}\nPosition/Skillset: ${sanitizedPosition || 'Not specified'}\n${resumeUrl ? `Resume: ${resumeUrl}` : 'Resume: Not provided'}\n\nPlease reach out to applicant for further steps.`,
                        Charset: 'UTF-8'
                    }
                }
            },
            ReplyToAddresses: sanitizedEmail ? [sanitizedEmail] : ['hr@navontech.com']
        };

        // Send confirmation email to applicant
        const applicantEmailParams = {
            Source: 'hr@navontech.com',
            Destination: {
                ToAddresses: [sanitizedEmail]
            },
            Message: {
                Subject: {
                    Data: 'Application Received - Navon Technologies',
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: `
                            <html>
                                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                                    <div style="max-width: 600px; margin: 0 auto;">
                                        <h2 style="color: #d4af37;">Thank You for Your Application!</h2>
                                        <p>Dear ${sanitizedName},</p>
                                        <p>We have successfully received your application for the <strong>${sanitizedPosition}</strong> position at Navon Technologies.</p>
                                        
                                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37;">
                                            <h3 style="margin-top: 0; color: #1e293b;">Application Summary</h3>
                                            <p><strong>Position/Skillset:</strong> ${sanitizedPosition}</p>
                                            <p><strong>Email:</strong> ${sanitizedEmail}</p>
                                            <p><strong>Resume:</strong> ${resumeUrl ? 'Attached' : 'Not provided'}</p>
                                        </div>

                                        <p>Our HR team will review your application and contact you if your qualifications match our current needs. This process typically takes 24-48 hours.</p>
                                        
                                        <p>If you have any questions, please feel free to reply to this email.</p>
                                        
                                        <p style="margin-top: 30px;">Best regards,<br>
                                        <strong>Navon Technologies HR Team</strong></p>
                                        
                                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                                        
                                        <p style="color: #64748b; font-size: 0.85em; text-align: center;">
                                            Navon Technologies<br>
                                            <a href="https://navontech.com" style="color: #d4af37; text-decoration: none;">www.navontech.com</a>
                                        </p>
                                    </div>
                                </body>
                            </html>
                        `,
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: `
Thank You for Your Application!

Dear ${sanitizedName},

We have successfully received your application for the ${sanitizedPosition} position at Navon Technologies.

Application Summary:
- Position/Skillset: ${sanitizedPosition}
- Email: ${sanitizedEmail}
- Resume: ${resumeUrl ? 'Attached' : 'Not provided'}

Our HR team will review your application and contact you if your qualifications match our current needs. This process typically takes 24-48 hours.

If you have any questions, please feel free to reply to this email.

Best regards,
Navon Technologies HR Team

Navon Technologies
www.navontech.com
                        `,
                        Charset: 'UTF-8'
                    }
                }
            },
            ReplyToAddresses: ['hr@navontech.com']
        };

        // Send all emails in parallel
        console.log('Sending HR notification email to: hr@navontech.com');
        console.log('Sending Security notification email to: security@navontech.com');
        
        const emailPromises = [
            sesClient.send(new SendEmailCommand(hrEmailParams)),
            sesClient.send(new SendEmailCommand(securityEmailParams))
        ];
        
        // Only send applicant confirmation if they have an email
        if (sanitizedEmail && validateEmail(sanitizedEmail)) {
            console.log('Sending applicant confirmation email to:', sanitizedEmail);
            emailPromises.push(sesClient.send(new SendEmailCommand(applicantEmailParams)));
        }
        
        await Promise.all(emailPromises);

        console.log('Emails sent successfully');
        console.log('Application processed successfully for:', sanitizedName);

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                message: 'Application submitted successfully'
            })
        };

    } catch (error) {
        console.error('Error processing application:', error);
        
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'An error occurred while processing your application. Please try again later.'
            })
        };
    }
};
