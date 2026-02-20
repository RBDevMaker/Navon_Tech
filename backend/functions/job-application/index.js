const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

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
        console.error('Rate limit check error:', error);
        // If rate limiting fails, allow the request (fail open)
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

        // Validate required fields
        if (!sanitizedName || !sanitizedEmail || !sanitizedPosition) {
            console.warn('Missing required fields', { name: !!name, email: !!email, position: !!position });
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    error: 'Missing required fields',
                    message: 'Name, email, and position are required'
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

        // Validate email format
        if (!validateEmail(sanitizedEmail)) {
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

        // Security: Check rate limiting
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

        let resumeUrl = null;

        // Upload resume to S3 if provided
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
            const s3Key = `resumes/${timestamp}-${sanitizedFileName}`;
            
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

        // Send email to HR via SES
        const hrEmailParams = {
            Source: 'hr@navontech.com', // Must be verified in SES
            Destination: {
                ToAddresses: ['hr@navontech.com']
            },
            Message: {
                Subject: {
                    Data: `New Job Application: ${sanitizedPosition}`,
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
                                        <p><strong>Position/Skillset:</strong> ${sanitizedPosition}</p>
                                        <p><strong>IP Address:</strong> ${ipAddress}</p>
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

Name: ${sanitizedName}
Email: ${sanitizedEmail}
Position/Skillset: ${sanitizedPosition}
IP Address: ${ipAddress}
${resumeUrl ? `Resume: ${resumeUrl}` : 'Resume: Not provided'}

This application was submitted through the Navon Technologies career portal.
                        `,
                        Charset: 'UTF-8'
                    }
                }
            },
            ReplyToAddresses: [sanitizedEmail]
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

        // Send both emails in parallel for faster response
        await Promise.all([
            sesClient.send(new SendEmailCommand(hrEmailParams)),
            sesClient.send(new SendEmailCommand(applicantEmailParams))
        ]);

        console.log('Application processed successfully for:', sanitizedEmail);

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
