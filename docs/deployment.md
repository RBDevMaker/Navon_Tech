# Deployment Guide

## Prerequisites

### Required Tools
- **Node.js 18+**
- **AWS CLI** configured with appropriate permissions
- **AWS SAM CLI** for serverless deployment
- **Amplify CLI** for frontend deployment
- **Git** for version control

### AWS Permissions Required
- CloudFormation (full access)
- Lambda (full access)
- API Gateway (full access)
- DynamoDB (full access)
- S3 (full access)
- Cognito (full access)
- IAM (create/update roles and policies)

## Local Development Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd tech-company-platform
npm run install:all
```

### 2. Configure Environment Variables
```bash
# Frontend environment (.env)
cp frontend/.env.example frontend/.env

# Edit with your values:
REACT_APP_AWS_REGION=us-east-1
REACT_APP_API_ENDPOINT=https://api.yourcompany.com
REACT_APP_S3_BUCKET=your-images-bucket
REACT_APP_S3_BASE_URL=https://your-cloudfront-domain.com
```

### 3. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # React dev server on :3000
npm run dev:backend   # SAM local API on :3001
```

## Backend Deployment (SAM)

### 1. First-time Setup
```bash
cd backend

# Build the application
sam build

# Deploy with guided setup
sam deploy --guided
```

### 2. Subsequent Deployments
```bash
cd backend
sam build && sam deploy
```

### 3. Environment-specific Deployments
```bash
# Development
sam deploy --parameter-overrides Environment=dev

# Staging
sam deploy --parameter-overrides Environment=staging

# Production
sam deploy --parameter-overrides Environment=prod
```

## Frontend Deployment (Amplify)

### 1. Initialize Amplify (First Time)
```bash
cd frontend

# Install Amplify CLI globally
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize project
amplify init
```

### 2. Add Amplify Services
```bash
# Add authentication
amplify add auth

# Add storage (S3)
amplify add storage

# Add hosting
amplify add hosting
```

### 3. Deploy Frontend
```bash
# Push backend resources
amplify push

# Deploy frontend
amplify publish
```

## CI/CD Pipeline Setup

### 1. GitHub Secrets Configuration
Add these secrets to your GitHub repository:

```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SAM_DEPLOYMENT_BUCKET=your-sam-deployment-bucket
```

### 2. Amplify Console Setup
1. Connect your GitHub repository to Amplify Console
2. Configure build settings using `amplify.yml`
3. Set environment variables in Amplify Console
4. Enable automatic deployments on push to main

### 3. Backend CI/CD
The GitHub Actions workflow will:
1. Run tests on all branches
2. Deploy backend to AWS on main branch push
3. Deploy frontend via Amplify Console

## Environment Configuration

### Development Environment
```yaml
# backend/samconfig.toml
[default.deploy.parameters]
stack_name = "tech-company-backend-dev"
s3_bucket = "sam-deployment-bucket-dev"
region = "us-east-1"
parameter_overrides = "Environment=dev"
```

### Production Environment
```yaml
# backend/samconfig.toml
[production.deploy.parameters]
stack_name = "tech-company-backend-prod"
s3_bucket = "sam-deployment-bucket-prod"
region = "us-east-1"
parameter_overrides = "Environment=prod"
```

## Database Setup

### 1. Initial Data Seeding
```bash
# Run data seeding script
cd backend
node scripts/seed-data.js
```

### 2. DynamoDB Table Structure
```javascript
// Primary Key Structure
PK: "CONTENT#PUBLIC" | "SOLUTIONS" | "PARTNERS" | "CAREERS" | "EMPLOYEE#<id>"
SK: "METADATA" | "JOB#<id>" | "PROFILE" | "PROJECT#<id>"

// GSI1 for queries
GSI1PK: "TYPE#<type>"
GSI1SK: "CREATED#<timestamp>"
```

## Monitoring and Logging

### CloudWatch Setup
- Lambda function logs
- API Gateway access logs
- DynamoDB metrics
- S3 access logs

### Amplify Monitoring
- Build logs
- Performance metrics
- Error tracking

## Troubleshooting

### Common Deployment Issues

1. **SAM deployment fails**
   ```bash
   # Check CloudFormation events
   aws cloudformation describe-stack-events --stack-name tech-company-backend-prod
   
   # Validate template
   sam validate
   ```

2. **Amplify build fails**
   - Check build logs in Amplify Console
   - Verify environment variables
   - Check Node.js version compatibility

3. **API Gateway CORS issues**
   - Verify CORS configuration in SAM template
   - Check preflight OPTIONS requests
   - Validate response headers

### Rollback Procedures

#### Backend Rollback
```bash
# List stack events to find last good deployment
aws cloudformation describe-stack-events --stack-name tech-company-backend-prod

# Rollback to previous version
aws cloudformation cancel-update-stack --stack-name tech-company-backend-prod
```

#### Frontend Rollback
```bash
# Via Amplify Console
amplify console

# Or via CLI
amplify env checkout <previous-environment>
amplify publish
```

## Security Checklist

- [ ] API Gateway has proper authentication
- [ ] S3 bucket policies are restrictive
- [ ] Cognito user pool is properly configured
- [ ] Lambda functions have minimal IAM permissions
- [ ] Environment variables don't contain secrets
- [ ] HTTPS is enforced everywhere
- [ ] CORS is properly configured

## Performance Optimization

### Frontend
- Enable CloudFront caching
- Optimize image sizes and formats
- Implement code splitting
- Use lazy loading for images

### Backend
- Configure Lambda memory appropriately
- Use DynamoDB efficiently
- Implement proper caching strategies
- Monitor cold start times

## Cost Optimization

### Monitoring Costs
```bash
# Check AWS costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost
```

### Cost-saving Strategies
- Use appropriate Lambda memory settings
- Implement S3 lifecycle policies
- Monitor DynamoDB read/write capacity
- Use CloudFront for static content caching