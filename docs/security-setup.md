# Security Setup Guide

## Overview
This document outlines the security measures implemented in the Navon Technologies website.

## 1. Custom HTTP Security Headers

Security headers have been configured in `amplify/customHttp.json` to protect against common web vulnerabilities:

- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME-sniffing attacks
- **X-XSS-Protection**: Enables browser XSS protection
- **Strict-Transport-Security (HSTS)**: Forces HTTPS connections
- **Content-Security-Policy (CSP)**: Controls resource loading
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### Deployment
To apply these headers in AWS Amplify:
1. Go to AWS Amplify Console
2. Select your app
3. Go to "App settings" > "Custom headers"
4. Upload the `amplify/customHttp.json` file
5. Redeploy your app

## 2. Lambda Function Security

### Input Validation
All Lambda functions now include:
- Input sanitization to prevent XSS attacks
- Email format validation
- File type and size validation
- Length restrictions on all inputs

### Rate Limiting
The job application function implements rate limiting using DynamoDB:
- Maximum 3 submissions per email per hour
- Automatic cleanup using TTL (24 hours)
- IP address tracking for additional security

### File Upload Security
- Only allows PDF, DOC, DOCX, and TXT files
- Maximum file size: 5MB
- Files are encrypted at rest (AES256)
- Sanitized file names to prevent path traversal

## 3. Google reCAPTCHA Setup

### Step 1: Get reCAPTCHA Keys
1. Go to https://www.google.com/recaptcha/admin
2. Register your site
3. Choose reCAPTCHA v2 (Checkbox)
4. Add your domains:
   - localhost (for testing)
   - your-amplify-domain.amplifyapp.com
   - navontech.com (if using custom domain)
5. Copy your Site Key and Secret Key

### Step 2: Add to Frontend
Add the reCAPTCHA script to `frontend/index.html`:

```html
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
```

### Step 3: Add Environment Variables
Create/update `frontend/.env`:

```
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

### Step 4: Backend Verification
The Lambda function is already set up to receive the reCAPTCHA token. To enable full verification:

1. Add the Secret Key to AWS Systems Manager Parameter Store:
```bash
aws ssm put-parameter \
  --name "/navontech/recaptcha/secret" \
  --value "your_secret_key_here" \
  --type "SecureString"
```

2. Update the Lambda function to verify the token (code provided in function)

## 4. CloudWatch Logging

### Log Groups Created
- API Gateway: 14 days retention
- Lambda Functions: 30-90 days retention
- Job Applications: 90 days retention (for compliance)

### Monitoring
Access logs in AWS CloudWatch Console:
1. Go to CloudWatch > Log groups
2. Filter by `/aws/lambda/` or `/aws/apigateway/`
3. Set up alarms for errors and suspicious activity

### Recommended Alarms
Create CloudWatch Alarms for:
- Lambda function errors (threshold: 5 in 5 minutes)
- API Gateway 4xx errors (threshold: 50 in 5 minutes)
- API Gateway 5xx errors (threshold: 10 in 5 minutes)
- Rate limit violations (custom metric)

## 5. DynamoDB Security

### Encryption
- Server-side encryption enabled (SSE)
- Point-in-time recovery enabled
- Automatic backups

### Access Control
- Lambda functions have minimal required permissions
- No public access
- IAM policies restrict access by function

## 6. S3 Bucket Security

### Current Configuration
- Public read access for images only
- Server-side encryption for uploads (AES256)
- Versioning recommended (not yet enabled)

### Recommended Actions
1. Enable versioning:
```bash
aws s3api put-bucket-versioning \
  --bucket navon-tech-images \
  --versioning-configuration Status=Enabled
```

2. Enable logging:
```bash
aws s3api put-bucket-logging \
  --bucket navon-tech-images \
  --bucket-logging-status file://logging.json
```

3. Block public access for non-image folders

## 7. API Security

### CORS Configuration
- Configured in SAM template
- Restricts allowed origins, methods, and headers
- Can be tightened in production

### Authentication
- Cognito User Pool for employee portal
- Public endpoints (job applications) have rate limiting
- API Gateway throttling enabled

## 8. Deployment Checklist

Before deploying to production:

- [ ] Update CORS_ORIGIN to specific domain (not *)
- [ ] Set up reCAPTCHA and add keys
- [ ] Enable S3 versioning and logging
- [ ] Set up CloudWatch alarms
- [ ] Review and test rate limiting
- [ ] Enable AWS WAF (optional, additional cost)
- [ ] Set up AWS GuardDuty for threat detection
- [ ] Review IAM policies for least privilege
- [ ] Enable AWS Config for compliance monitoring
- [ ] Set up backup strategy for DynamoDB

## 9. Ongoing Security

### Regular Tasks
- Review CloudWatch logs weekly
- Update dependencies monthly
- Review IAM permissions quarterly
- Conduct security audits annually

### Incident Response
1. Monitor CloudWatch alarms
2. Investigate suspicious activity
3. Review rate limit violations
4. Check for unusual API patterns

## 10. Compliance

### Data Protection
- All data encrypted in transit (HTTPS)
- All data encrypted at rest (S3, DynamoDB)
- Resume files stored securely
- Email addresses protected

### Privacy
- No unnecessary data collection
- Clear privacy policy on website
- GDPR-compliant data handling
- Right to deletion supported

## Support

For security concerns or questions:
- Email: security@navontech.com
- Review: docs/security-compliance.md on website
