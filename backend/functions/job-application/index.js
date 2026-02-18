const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
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
        const { name, email, position, resumeData, resumeFileName, resumeContentType } = body;

        // Validate required fields
        if (!name || !email || !position) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    error: 'Missing required fields',
                    message: 'Name, email, and position are required'
                })
            };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    error: 'Invalid email format',
                    message: 'Please provide a valid email address'
                })
            };
        }

        let resumeUrl = null;

        // Upload resume to S3 if provided
        if (resumeData && resumeFileName) {
            const timestamp = Date.now();
            const sanitizedFileName = resumeFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
            const s3Key = `resumes/${timestamp}-${sanitizedFileName}`;
            
            // Convert base64 to buffer
            const buffer = Buffer.from(resumeData, 'base64');
            
            const uploadParams = {
                Bucket: process.env.S3_BUCKET || 'navon-tech-images',
                Key: s3Key,
                Body: buffer,
                ContentType: resumeContentType || 'application/pdf',
                ServerSideEncryption: 'AES256'
            };

            await s3Client.send(new PutObjectCommand(uploadParams));
            resumeUrl = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
        }

        // Send email via SES
        const emailParams = {
            Source: 'HR@navontech.com', // Must be verified in SES
            Destination: {
                ToAddresses: ['HR@navontech.com']
            },
            Message: {
                Subject: {
                    Data: `New Job Application: ${position}`,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: `
                            <html>
                                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                                    <h2 style="color: #d4af37;">New Job Application Received</h2>
                                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <p><strong>Name:</strong> ${name}</p>
                                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                                        <p><strong>Position/Skillset:</strong> ${position}</p>
                                        ${resumeUrl ? `<p><strong>Resume:</strong> <a href="${resumeUrl}">Download Resume</a></p>` : '<p><strong>Resume:</strong> Not provided</p>'}
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
                        Data: `
New Job Application Received

Name: ${name}
Email: ${email}
Position/Skillset: ${position}
${resumeUrl ? `Resume: ${resumeUrl}` : 'Resume: Not provided'}

This application was submitted through the Navon Technologies career portal.
                        `,
                        Charset: 'UTF-8'
                    }
                }
            },
            ReplyToAddresses: [email]
        };

        await sesClient.send(new SendEmailCommand(emailParams));

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
                message: error.message
            })
        };
    }
};
