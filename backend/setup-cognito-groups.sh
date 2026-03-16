#!/bin/bash
# Cognito User Pool and Group Setup for Navon Technologies
# User Pool ID: us-east-1_ku7FhV68P

USER_POOL_ID="us-east-1_ku7FhV68P"
TEMP_PASSWORD="NavonTemp2024!"

echo "========================================="
echo "Navon Technologies - Cognito Setup Script"
echo "========================================="
echo ""

# Step 1: Create Groups
echo "--- Creating Groups ---"
aws cognito-idp create-group --user-pool-id $USER_POOL_ID --group-name "Navon_Employees" --description "All Navon Tech employees" --precedence 4
aws cognito-idp create-group --user-pool-id $USER_POOL_ID --group-name "HR" --description "Human Resources - full employee data access" --precedence 3
aws cognito-idp create-group --user-pool-id $USER_POOL_ID --group-name "Admin" --description "Administrators - full access except salary" --precedence 2
aws cognito-idp create-group --user-pool-id $USER_POOL_ID --group-name "SuperAdmin" --description "Super Administrators - full system access" --precedence 1
echo "✅ Groups created"
echo ""

# Step 2: Create Users (all 15 employees)
echo "--- Creating Users ---"
USERS=(
  "brian.baltimore@navontech.com:Brian Baltimore"
  "brian.briscoe@navontech.com:Brian Briscoe"
  "jay.brown@navontech.com:Jay Brown"
  "rachelle.briscoe@navontech.com:Rachelle Briscoe"
  "gregory.bryant@navontech.com:Gregory Bryant"
  "yahvinah.bryant@navontech.com:Yahvinah Bryant"
  "marcus.collier@navontech.com:Marcus Collier"
  "roland.dupree@navontech.com:Roland Dupree"
  "clinton.elleby@navontech.com:Clinton Elleby"
  "theodros.fekade@navontech.com:Theodros Fekade"
  "donnell.fuell@navontech.com:Donnell Fuell"
  "zane.johnson@navontech.com:Zane Johnson"
  "naquishba.porter@navontech.com:Naquishba Porter"
  "steffen.thomas@navontech.com:Steffen Thomas"
  "tammy.thompson@navontech.com:Tammy Thompson"
)

for entry in "${USERS[@]}"; do
  EMAIL="${entry%%:*}"
  NAME="${entry##*:}"
  echo "Creating user: $EMAIL ($NAME)"
  aws cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username "$EMAIL" \
    --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true Name=name,Value="$NAME" \
    --temporary-password "$TEMP_PASSWORD" \
    --message-action SUPPRESS \
    2>/dev/null || echo "  (user may already exist)"
done
echo "✅ Users created"
echo ""

# Step 3: Add ALL users to Navon_Employees group
echo "--- Adding all users to Navon_Employees ---"
for entry in "${USERS[@]}"; do
  EMAIL="${entry%%:*}"
  aws cognito-idp admin-add-user-to-group \
    --user-pool-id $USER_POOL_ID \
    --username "$EMAIL" \
    --group-name "Navon_Employees"
  echo "  Added $EMAIL to Navon_Employees"
done
echo "✅ All users added to Navon_Employees"
echo ""

# Step 4: Assign special roles
echo "--- Assigning Special Roles ---"

# Yahvinah → HR
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username "yahvinah.bryant@navontech.com" \
  --group-name "HR"
echo "  ✅ Yahvinah Bryant → HR"

# Gregory → Admin
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username "gregory.bryant@navontech.com" \
  --group-name "Admin"
echo "  ✅ Gregory Bryant → Admin"

# Rachelle → SuperAdmin
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username "rachelle.briscoe@navontech.com" \
  --group-name "SuperAdmin"
echo "  ✅ Rachelle Briscoe → SuperAdmin"

# Brian Briscoe → SuperAdmin
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username "brian.briscoe@navontech.com" \
  --group-name "SuperAdmin"
echo "  ✅ Brian Briscoe → SuperAdmin"

echo ""
echo "========================================="
echo "✅ SETUP COMPLETE"
echo "========================================="
echo ""
echo "Temporary password for all users: $TEMP_PASSWORD"
echo "Users will be prompted to change password on first login."
echo ""
echo "Group Assignments:"
echo "  Navon_Employees: ALL 15 users"
echo "  HR:              Yahvinah Bryant"
echo "  Admin:           Gregory Bryant"
echo "  SuperAdmin:      Rachelle Briscoe, Brian Briscoe"
echo ""
echo "Role Priority: SuperAdmin > Admin > HR > Employee"
