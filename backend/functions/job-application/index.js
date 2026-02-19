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

        // Send email to HR via SES
        const hrEmailParams = {
            Source: 'hr@navontech.com', // Must be verified in SES
            Destination: {
                ToAddresses: ['hr@navontech.com']
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

        // Send confirmation email to applicant
        const applicantEmailParams = {
            Source: 'hr@navontech.com',
            Destination: {
                ToAddresses: [email]
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
                                        <p>Dear ${name},</p>
                                        <p>We have successfully received your application for the <strong>${position}</strong> position at Navon Technologies.</p>
                                        
                                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37;">
                                            <h3 style="margin-top: 0; color: #1e293b;">Application Summary</h3>
                                            <p><strong>Position/Skillset:</strong> ${position}</p>
                                            <p><strong>Email:</strong> ${email}</p>
                                            <p><strong>Resume:</strong> ${resumeUrl ? 'Attached' : 'Not provided'}</p>
                                        </div>

                                        <p>Our HR team will review your application and contact you if your qualifications match our current needs. This process typically takes 1-2 weeks.</p>
                                        
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

Dear ${name},

We have successfully received your application for the ${position} position at Navon Technologies.

Application Summary:
- Position/Skillset: ${position}
- Email: ${email}
- Resume: ${resumeUrl ? 'Attached' : 'Not provided'}

Our HR team will review your application and contact you if your qualifications match our current needs. This process typically takes 1-2 weeks.

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

        // Send both emails in parallel for faster response
        await Promise.all([
            sesClient.send(new SendEmailCommand(hrEmailParams)),
            sesClient.send(new SendEmailCommand(applicantEmailParams))
        ]);

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
