#!/bin/bash

# Setup Cognito Users and Groups for Navon Tech Portal
# This script creates HR and Admin groups and adds users

STACK_NAME="NavonTechBackend"
REGION="us-east-1"

# Get User Pool ID from CloudFormation stack
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
  --output text)

echo "User Pool ID: $USER_POOL_ID"

# Create HR group
echo "Creating HR group..."
aws cognito-idp create-group \
  --group-name HR \
  --user-pool-id $USER_POOL_ID \
  --description "HR Managers with full access to employee data" \
  --region $REGION 2>/dev/null || echo "HR group already exists"

# Create Admin group
echo "Creating Admin group..."
aws cognito-idp create-group \
  --group-name Admin \
  --user-pool-id $USER_POOL_ID \
  --description "Administrators with full system access" \
  --region $REGION 2>/dev/null || echo "Admin group already exists"

echo ""
echo "Groups created successfully!"
echo ""
echo "Now add your users:"
echo "1. Go to AWS Console > Cognito > User Pools > $USER_POOL_ID"
echo "2. Click 'Create user' for each email:"
echo "   - HR user: your-hr@navontech.com"
echo "   - Admin users: admin1@navontech.com, admin2@navontech.com, admin3@navontech.com"
echo "3. After creating users, add them to groups:"
echo "   - Go to 'Groups' tab"
echo "   - Select group (HR or Admin)"
echo "   - Click 'Add users to group'"
echo ""
echo "Or use these commands to create users:"
echo ""
echo "# Create HR user"
echo "aws cognito-idp admin-create-user \\"
echo "  --user-pool-id $USER_POOL_ID \\"
echo "  --username hr@navontech.com \\"
echo "  --user-attributes Name=email,Value=hr@navontech.com Name=email_verified,Value=true \\"
echo "  --region $REGION"
echo ""
echo "# Add to HR group"
echo "aws cognito-idp admin-add-user-to-group \\"
echo "  --user-pool-id $USER_POOL_ID \\"
echo "  --username hr@navontech.com \\"
echo "  --group-name HR \\"
echo "  --region $REGION"
