# Job Application Form Setup Guide

This guide explains how to deploy the job application Lambda function that sends emails to HR@navontech.com.

## Prerequisites

1. AWS CLI installed and configured
2. SAM CLI installed
3. AWS SES (Simple Email Service) configured

## Step 1: Verify Email Address in AWS SES

Before the Lambda function can send emails, you need to verify the email address in AWS SES:

1. Go to AWS Console → Amazon SES
2. Click "Verified identities" in the left menu
3. Click "Create identity"
4. Select "Email address"
5. Enter: `HR@navontech.com`
6. Click "Create identity"
7. Check the inbox for HR@navontech.com and click the verification link

**Note:** If you're in the SES Sandbox (default for new accounts), you can only send emails to verified addresses. To send to any email address, request production access:
- Go to SES → Account dashboard
- Click "Request production access"
- Fill out the form explaining your use case

## Step 2: Deploy the Backend

From the `backend` directory:

```bash
cd backend

# Install dependencies for the new function
cd functions/job-application
npm install
cd ../..

# Build and deploy
sam build
sam deploy --guided
```

During the guided deployment, use these settings:
- Stack Name: `navon-tech-backend` (or your preferred name)
- AWS Region: `us-east-1` (or your preferred region)
- Parameter Environment: `prod`
- Parameter CorsOrigin: `*` (or your specific domain)
- Confirm changes before deploy: Y
- Allow SAM CLI IAM role creation: Y
- Save arguments to configuration file: Y

## Step 3: Get the API Gateway URL

After deployment completes, note the API Gateway endpoint URL from the outputs:

```
Outputs:
ApiGatewayEndpoint: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

## Step 4: Update Frontend Configuration

In `frontend/src/SimpleApp.jsx`, find this line (around line 3020):

```javascript
const apiEndpoint = 'YOUR_API_GATEWAY_URL/api/apply';
```

Replace it with your actual API Gateway URL:

```javascript
const apiEndpoint = 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/api/apply';
```

## Step 5: Test the Application

1. Go to your website's careers page
2. Fill out the application form
3. Upload a resume (PDF, DOC, or DOCX)
4. Click "Submit Application"
5. Check HR@navontech.com inbox for the application email

## Troubleshooting

### Email not received

1. **Check SES verification**: Make sure HR@navontech.com is verified in SES
2. **Check CloudWatch Logs**: 
   - Go to CloudWatch → Log groups
   - Find `/aws/lambda/[your-stack-name]-JobApplicationFunction-xxxxx`
   - Check for errors
3. **Check SES Sandbox**: If in sandbox mode, you can only send to verified addresses

### CORS errors

If you see CORS errors in the browser console:
1. Make sure the `CorsOrigin` parameter in template.yaml matches your frontend domain
2. Redeploy the backend after changing CORS settings

### File upload issues

- Maximum file size is 5MB (can be adjusted in the Lambda function)
- Supported formats: PDF, DOC, DOCX
- Files are stored in the S3 bucket: `navon-tech-images/resumes/`

## Email Format

The HR team will receive emails with:
- Subject: "New Job Application: [Position]"
- Applicant name, email, and position
- Link to download the resume from S3
- Reply-to address set to the applicant's email

## Security Notes

- Resume files are encrypted at rest in S3 (AES256)
- Email addresses are validated on both frontend and backend
- API endpoint has no authentication (public form)
- Consider adding rate limiting if you experience spam

## Cost Considerations

- SES: $0.10 per 1,000 emails (first 62,000 emails/month free with EC2/Lambda)
- Lambda: Free tier covers 1M requests/month
- S3: Minimal cost for resume storage
- API Gateway: $3.50 per million requests (first 1M free for 12 months)

## Maintenance

### Updating the Lambda Function

```bash
cd backend
sam build
sam deploy
```

### Viewing Application Logs

```bash
sam logs -n JobApplicationFunction --stack-name navon-tech-backend --tail
```

### Cleaning Up Old Resumes

Resumes are stored indefinitely in S3. Consider setting up an S3 lifecycle policy to delete files older than 90 days:

1. Go to S3 → navon-tech-images bucket
2. Management → Lifecycle rules
3. Create rule to expire objects in `resumes/` folder after 90 days
