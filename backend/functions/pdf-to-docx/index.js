const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET || 'navon-tech-images';

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
};

// Extract candidate name from the first meaningful line of text
function extractName(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    for (const line of lines.slice(0, 5)) {
        // Skip lines that look like headers/labels (e.g., "RESUME", "CURRICULUM VITAE", emails, phones, URLs)
        const lower = line.toLowerCase();
        if (lower === 'resume' || lower === 'curriculum vitae' || lower === 'cv') continue;
        if (line.includes('@') || line.match(/^\(?\d{3}/) || line.includes('http')) continue;
        if (line.length > 50) continue; // Names are short
        
        // Likely a name — clean it up
        const name = line.replace(/[|•·,]+$/, '').trim();
        if (name.length >= 3 && name.split(/\s+/).length <= 5) {
            return name;
        }
    }
    return null;
}

// Format name as "Last, First"
function formatLastFirst(name) {
    if (!name) return null;
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0];
    const last = parts[parts.length - 1];
    const first = parts.slice(0, parts.length - 1).join(' ');
    return `${last}, ${first}`;
}

exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: HEADERS, body: '' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { s3Key, s3Keys, action } = body;

        // Handle delete action
        if (action === 'delete') {
            if (!s3Key) {
                return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing s3Key parameter' }) };
            }
            await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }));
            return {
                statusCode: 200,
                headers: HEADERS,
                body: JSON.stringify({ message: 'File deleted successfully', deletedKey: s3Key })
            };
        }

        // Handle getName action — extract candidate name from PDF or DOCX
        if (action === 'getNames') {
            const keys = s3Keys || (s3Key ? [s3Key] : []);
            if (keys.length === 0) {
                return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing s3Keys parameter' }) };
            }

            const results = {};
            
            for (const key of keys) {
                try {
                    const getResponse = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
                    const fileBuffer = Buffer.from(await getResponse.Body.transformToByteArray());
                    
                    let text = '';
                    const lowerKey = key.toLowerCase();
                    
                    if (lowerKey.endsWith('.pdf')) {
                        const pdfData = await pdf(fileBuffer);
                        text = pdfData.text || '';
                    } else if (lowerKey.endsWith('.docx') || lowerKey.endsWith('.doc')) {
                        const result = await mammoth.extractRawText({ buffer: fileBuffer });
                        text = result.value || '';
                    }
                    
                    const name = extractName(text);
                    results[key] = formatLastFirst(name);
                } catch (err) {
                    console.error(`Error extracting name from ${key}:`, err.message);
                    results[key] = null;
                }
            }

            return {
                statusCode: 200,
                headers: HEADERS,
                body: JSON.stringify({ names: results })
            };
        }

        // Handle convert action (default)
        if (!s3Key) {
            return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing s3Key parameter' }) };
        }

        if (!s3Key.toLowerCase().endsWith('.pdf')) {
            return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'File is not a PDF' }) };
        }

        // Download PDF from S3
        const getResponse = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }));
        const pdfBuffer = Buffer.from(await getResponse.Body.transformToByteArray());

        // Parse PDF text
        const pdfData = await pdf(pdfBuffer);
        const text = pdfData.text || '';

        // Split text into paragraphs and create DOCX
        const lines = text.split('\n').filter(line => line.trim());
        
        const docParagraphs = lines.map(line => {
            const trimmed = line.trim();
            const isHeading = trimmed.length < 60 && trimmed === trimmed.toUpperCase() && trimmed.length > 2;
            
            if (isHeading) {
                return new Paragraph({
                    children: [new TextRun({ text: trimmed, bold: true, size: 28 })],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 240, after: 120 }
                });
            }
            
            return new Paragraph({
                children: [new TextRun({ text: trimmed, size: 22 })],
                spacing: { after: 80 }
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: `Converted from: ${s3Key.split('/').pop()}`, italics: true, size: 18, color: '666666' })],
                        spacing: { after: 200 }
                    }),
                    ...docParagraphs
                ]
            }]
        });

        const docxBuffer = await Packer.toBuffer(doc);

        // Generate DOCX S3 key
        const docxS3Key = s3Key.replace(/\.pdf$/i, '.docx');

        // Upload DOCX to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: docxS3Key,
            Body: docxBuffer,
            ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ContentDisposition: `attachment; filename="${docxS3Key.split('/').pop()}"`
        }));

        const region = process.env.AWS_REGION || 'us-east-1';
        const docxUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${docxS3Key}`;

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                message: 'PDF converted to DOCX successfully',
                docxKey: docxS3Key,
                docxUrl: docxUrl
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: 'Operation failed', message: error.message })
        };
    }
};
