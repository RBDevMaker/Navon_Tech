const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

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

        // Handle Cleared Candidate Summary notification
        if (body.type === 'candidate-summary-notification') {
            const { candidateName, clearanceLevel, recruiter, conversationDate, notifyEmail } = body;
            
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
                    <div style="text-align:center;margin-bottom:20px;">
                        <a href="https://navontech.com/#login" style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;text-decoration:none;padding:12px 30px;border-radius:8px;font-size:15px;font-weight:700;">Review in Portal →</a>
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

        // Validate required fields
        if (!sanitizedName || !sanitizedEmail) {
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
            ReplyToAddresses: [sanitizedEmail]
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

        // Send all emails in parallel
        console.log('Sending HR notification email to: hr@navontech.com');
        console.log('Sending Security notification email to: security@navontech.com');
        console.log('Sending applicant confirmation email to:', sanitizedEmail);
        
        const [hrEmailResult, securityEmailResult, applicantEmailResult] = await Promise.all([
            sesClient.send(new SendEmailCommand(hrEmailParams)),
            sesClient.send(new SendEmailCommand(securityEmailParams)),
            sesClient.send(new SendEmailCommand(applicantEmailParams))
        ]);

        console.log('HR email sent successfully. MessageId:', hrEmailResult.MessageId);
        console.log('Applicant confirmation email sent successfully. MessageId:', applicantEmailResult.MessageId);
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
