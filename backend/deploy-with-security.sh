#!/bin/bash

# Deployment script with security checks
# Usage: ./deploy-with-security.sh [dev|staging|prod]

set -e

ENVIRONMENT=${1:-dev}
STACK_NAME="NavonTechBackend"

echo "🔒 Deploying Navon Tech Backend with Security Features"
echo "Environment: $ENVIRONMENT"
echo "Stack: $STACK_NAME"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure'"
    exit 1
fi

echo "✅ AWS CLI configured"

# Build the SAM application
echo ""
echo "📦 Building SAM application..."
sam build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Deploy the application
echo ""
echo "🚀 Deploying to AWS..."
sam deploy \
    --stack-name $STACK_NAME \
    --parameter-overrides Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Deployment successful"

# Get the API endpoint
echo ""
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "🔒 Security Checklist:"
echo "  [ ] CloudWatch logs are enabled"
echo "  [ ] Rate limiting table created"
echo "  [ ] Lambda functions have proper IAM roles"
echo "  [ ] DynamoDB encryption enabled"
echo "  [ ] S3 encryption enabled"
echo ""
echo "⚠️  Next Steps:"
echo "  1. Set up reCAPTCHA (see docs/security-setup.md)"
echo "  2. Configure CloudWatch alarms"
echo "  3. Review security headers in Amplify"
echo "  4. Test rate limiting"
echo "  5. Enable S3 versioning"
echo ""
echo "✨ Deployment complete!"
