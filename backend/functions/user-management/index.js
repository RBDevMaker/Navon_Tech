const { CognitoIdentityProviderClient, ListUsersCommand, AdminGetUserCommand, AdminListGroupsForUserCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, AdminUpdateUserAttributesCommand, AdminDeleteUserCommand, AdminResetUserPasswordCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USER_POOL_ID = process.env.USER_POOL_ID;
const AUDIT_TABLE = 'AuditLogs';

// Helper function to log audit events
async function logAuditEvent(eventData) {
    try {
        const timestamp = Date.now();
        const eventId = uuidv4();
        
        const auditEntry = {
            eventId,
            timestamp,
            ...eventData,
            ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year retention
        };

        const command = new PutCommand({
            TableName: AUDIT_TABLE,
            Item: auditEntry
        });

        await docClient.send(command);
        console.log('Audit log created:', eventId);
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break main functionality
    }
}

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
};

// Role hierarchy for validation
const ROLE_HIERARCHY = {
    'employee': 1,
    'admin': 2,
    'hr': 3,
    'superadmin': 4
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
        const path = event.path || event.rawPath || '';
        const method = event.httpMethod || event.requestContext?.http?.method;
        
        console.log('Processing request:', { path, method });
        
        // Get requester's role from Cognito groups
        const requesterRole = await getRequesterRole(event);
        console.log('Requester role:', requesterRole);
        
        // Extract username from path
        const pathParts = path.split('/');
        const username = pathParts[pathParts.length - 1];

        switch (method) {
            case 'GET':
                if (username && username !== 'users') {
                    // Get single user
                    return await getUser(username, requesterRole);
                } else {
                    // Get all users
                    return await getAllUsers(requesterRole);
                }
            
            case 'PUT':
                // Update user role or attributes
                const updateData = JSON.parse(event.body);
                return await updateUser(username, updateData, requesterRole);
            
            case 'POST':
                // Invite user or reset password
                const postData = JSON.parse(event.body);
                if (postData.action === 'invite') {
                    return await inviteUser(username, postData, requesterRole);
                } else if (postData.action === 'resetPassword') {
                    return await resetUserPassword(username, postData, requesterRole);
                }
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: 'Invalid action. Use "invite" or "resetPassword"' })
                };
            
            case 'DELETE':
                // Delete user
                return await deleteUser(username, requesterRole);
            
            default:
                return {
                    statusCode: 405,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        console.error('Error stack:', error.stack);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                details: error.stack
            })
        };
    }
};

async function getRequesterRole(event) {
    // Extract role from Cognito authorizer claims
    const claims = event.requestContext?.authorizer?.claims;
    console.log('Full event.requestContext:', JSON.stringify(event.requestContext, null, 2));
    console.log('Claims:', JSON.stringify(claims, null, 2));
    
    if (!claims) {
        throw new Error('No authorization claims found');
    }
    
    // Get username from claims
    const username = claims['cognito:username'] || claims.username || claims.sub;
    console.log('Username from claims:', username);
    
    // Cognito groups can be passed as array or comma-separated string
    let groups = [];
    const cognitoGroups = claims['cognito:groups'];
    console.log('cognito:groups raw value:', cognitoGroups, 'type:', typeof cognitoGroups);
    
    if (Array.isArray(cognitoGroups)) {
        groups = cognitoGroups;
    } else if (typeof cognitoGroups === 'string') {
        groups = cognitoGroups.split(',').map(g => g.trim());
    }
    
    console.log('Parsed groups from claims:', groups);
    
    // If no groups found in claims, fetch from Cognito directly
    if (groups.length === 0 && username) {
        console.log('No groups in claims, fetching from Cognito for user:', username);
        try {
            const groupsCommand = new AdminListGroupsForUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: username
            });
            const groupsResponse = await cognitoClient.send(groupsCommand);
            const userGroups = groupsResponse.Groups || [];
            groups = userGroups.map(g => g.GroupName);
            console.log('Groups fetched from Cognito:', groups);
        } catch (error) {
            console.error('Error fetching user groups from Cognito:', error);
            // Continue with empty groups array
        }
    }
    
    // Normalize groups to lowercase for comparison
    const normalizedGroups = groups.map(g => g.toLowerCase());
    console.log('Normalized groups:', normalizedGroups);
    
    // Return highest role
    if (normalizedGroups.includes('superadmin')) return 'superadmin';
    if (normalizedGroups.includes('hr')) return 'hr';
    if (normalizedGroups.includes('admin')) return 'admin';
    return 'employee';
}

async function getAllUsers(requesterRole) {
    try {
        console.log('getAllUsers called with requesterRole:', requesterRole);
        
        // Only superadmin, hr, and admin can list users
        if (!['superadmin', 'hr', 'admin'].includes(requesterRole)) {
            console.log('Permission denied for role:', requesterRole);
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    error: 'Insufficient permissions',
                    requesterRole: requesterRole,
                    allowedRoles: ['superadmin', 'hr', 'admin']
                })
            };
        }

        const command = new ListUsersCommand({
            UserPoolId: USER_POOL_ID
        });

        const response = await cognitoClient.send(command);
        
        // Get detailed info for each user including groups
        const usersWithGroups = await Promise.all(
            response.Users.map(async (user) => {
                const userDetails = await getUserDetails(user.Username);
                return userDetails;
            })
        );

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                users: usersWithGroups,
                count: usersWithGroups.length
            })
        };
    } catch (error) {
        console.error('Error listing users:', error);
        throw error;
    }
}

async function getUser(username, requesterRole) {
    try {
        // Only superadmin, hr, and admin can view user details
        if (!['superadmin', 'hr', 'admin'].includes(requesterRole)) {
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'Insufficient permissions' })
            };
        }

        const userDetails = await getUserDetails(username);

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(userDetails)
        };
    } catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
}

async function getUserDetails(username) {
    const command = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username
    });

    const response = await cognitoClient.send(command);
    
    // Extract attributes
    const attributes = {};
    response.UserAttributes.forEach(attr => {
        attributes[attr.Name] = attr.Value;
    });

    // Fetch user groups separately
    const groupsCommand = new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username
    });
    
    const groupsResponse = await cognitoClient.send(groupsCommand);
    const groups = groupsResponse.Groups || [];
    const groupNames = groups.map(g => g.GroupName);
    const normalizedGroups = groupNames.map(g => g.toLowerCase());
    
    // Determine role from groups (normalize to lowercase)
    let role = 'employee';
    if (normalizedGroups.includes('superadmin')) role = 'superadmin';
    else if (normalizedGroups.includes('hr')) role = 'hr';
    else if (normalizedGroups.includes('admin')) role = 'admin';

    return {
        username: response.Username,
        email: attributes.email,
        emailVerified: attributes.email_verified === 'true',
        enabled: response.Enabled,
        status: response.UserStatus,
        created: response.UserCreateDate,
        modified: response.UserLastModifiedDate,
        role: role,
        groups: groupNames,
        attributes: attributes
    };
}

async function updateUser(username, updateData, requesterRole) {
    try {
        // Check permissions
        if (!['superadmin', 'hr', 'admin'].includes(requesterRole)) {
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'Insufficient permissions' })
            };
        }

        // Get target user's current role
        const targetUser = await getUserDetails(username);
        const targetRole = targetUser.role;

        // HR cannot modify superadmin accounts
        if (requesterRole === 'hr' && targetRole === 'superadmin') {
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'HR cannot modify SuperAdmin accounts' })
            };
        }

        // Admin can only modify employees
        if (requesterRole === 'admin' && targetRole !== 'employee') {
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'Admin can only modify Employee accounts' })
            };
        }

        // Update role if specified
        if (updateData.newRole && updateData.newRole !== targetRole) {
            // Validate role change permissions
            if (requesterRole === 'hr' && updateData.newRole === 'superadmin') {
                return {
                    statusCode: 403,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: 'HR cannot promote users to SuperAdmin' })
                };
            }

            if (requesterRole === 'admin') {
                return {
                    statusCode: 403,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: 'Admin cannot change user roles' })
                };
            }

            // Map lowercase role names to actual Cognito group names
            const roleToGroupName = {
                'employee': null,
                'admin': 'Admin',
                'hr': 'HR',
                'superadmin': 'SuperAdmin'
            };

            // Remove from old group
            if (targetRole !== 'employee') {
                const oldGroupName = roleToGroupName[targetRole];
                if (oldGroupName) {
                    await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
                        UserPoolId: USER_POOL_ID,
                        Username: username,
                        GroupName: oldGroupName
                    }));
                }
            }

            // Add to new group
            if (updateData.newRole !== 'employee') {
                const newGroupName = roleToGroupName[updateData.newRole];
                if (newGroupName) {
                    await cognitoClient.send(new AdminAddUserToGroupCommand({
                        UserPoolId: USER_POOL_ID,
                        Username: username,
                        GroupName: newGroupName
                    }));
                }
            }
        }

        // Update attributes if specified
        if (updateData.attributes) {
            const attributeUpdates = Object.entries(updateData.attributes).map(([key, value]) => ({
                Name: key,
                Value: value
            }));

            if (attributeUpdates.length > 0) {
                await cognitoClient.send(new AdminUpdateUserAttributesCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: username,
                    UserAttributes: attributeUpdates
                }));
            }
        }

        // Get updated user details
        const updatedUser = await getUserDetails(username);

        // Log audit event for role change
        if (updateData.newRole && updateData.newRole !== targetRole) {
            await logAuditEvent({
                userId: username,
                userEmail: updatedUser.email,
                eventType: 'ROLE_CHANGE',
                action: `Changed role from ${targetRole} to ${updateData.newRole}`,
                targetUser: username,
                changes: {
                    oldRole: targetRole,
                    newRole: updateData.newRole
                },
                success: true
            });
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                message: 'User updated successfully',
                user: updatedUser
            })
        };
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

async function deleteUser(username, requesterRole) {
    try {
        // Only superadmin and hr can delete users
        if (!['superadmin', 'hr'].includes(requesterRole)) {
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'Insufficient permissions to delete users' })
            };
        }

        // Get target user's role
        const targetUser = await getUserDetails(username);
        const targetRole = targetUser.role;

        // HR cannot delete superadmin accounts
        if (requesterRole === 'hr' && targetRole === 'superadmin') {
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'HR cannot delete SuperAdmin accounts' })
            };
        }

        // Delete the user
        await cognitoClient.send(new AdminDeleteUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: username
        }));

        // Log audit event for user deletion
        await logAuditEvent({
            userId: username,
            userEmail: targetUser.email,
            eventType: 'USER_DELETE',
            action: `Deleted user account`,
            targetUser: username,
            changes: {
                deletedRole: targetRole
            },
            success: true
        });

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                message: 'User deleted successfully',
                username: username
            })
        };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

async function inviteUser(username, data, requesterRole) {
    try {
        if (!['superadmin', 'hr'].includes(requesterRole)) {
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'Only SuperAdmin and HR can send invitations' })
            };
        }

        const userDetails = await getUserDetails(username);
        const tempPassword = data.tempPassword || 'NavonTemp2024!';
        const portalUrl = data.portalUrl || 'https://navontech.com/#portal';

        // Set a new temporary password so user is forced to change on login
        await cognitoClient.send(new AdminSetUserPasswordCommand({
            UserPoolId: USER_POOL_ID,
            Username: username,
            Password: tempPassword,
            Permanent: false
        }));

        // Build the invitation email
        const employeeName = userDetails.attributes?.name || username.split('@')[0];
        const roleName = userDetails.role === 'superadmin' ? 'Super Administrator' :
                         userDetails.role === 'hr' ? 'Human Resources' :
                         userDetails.role === 'admin' ? 'Administrator' : 'Employee';

        const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);padding:40px 40px 30px;text-align:center;">
<h1 style="color:#d4af37;font-size:28px;margin:0 0 8px;font-weight:800;letter-spacing:1px;">NAVON TECHNOLOGIES</h1>
<p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0;letter-spacing:2px;">EMPLOYEE PORTAL INVITATION</p>
</td></tr>

<!-- Gold Divider -->
<tr><td style="background:#d4af37;height:4px;"></td></tr>

<!-- Body -->
<tr><td style="padding:40px;">
<h2 style="color:#1e3a8a;font-size:22px;margin:0 0 20px;">Welcome, ${employeeName}</h2>
<p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px;">
You have been granted access to the <strong>Navon Technologies Employee Portal</strong>. This secure platform provides access to company resources, your employee profile, team directory, and more.
</p>

<!-- Credentials Box -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:24px;">
<h3 style="color:#1e3a8a;font-size:16px;margin:0 0 16px;border-bottom:2px solid #d4af37;padding-bottom:8px;">🔐 Your Login Credentials</h3>
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:8px 0;color:#64748b;font-size:14px;width:140px;">Username:</td>
<td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${userDetails.email}</td>
</tr>
<tr>
<td style="padding:8px 0;color:#64748b;font-size:14px;">Temporary Password:</td>
<td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${tempPassword}</td>
</tr>
<tr>
<td style="padding:8px 0;color:#64748b;font-size:14px;">Access Level:</td>
<td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${roleName}</td>
</tr>
</table>
</td></tr>
</table>

<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td align="center">
<a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:0.5px;">
Access Employee Portal →
</a>
</td></tr>
</table>

<!-- Instructions -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:2px solid #fbbf24;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:20px;">
<h3 style="color:#92400e;font-size:14px;margin:0 0 12px;">⚠️ Important - First Login Instructions</h3>
<ol style="color:#92400e;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
<li>Click the portal link above or visit the URL directly</li>
<li>Enter your username and temporary password</li>
<li>You will be prompted to create a new password</li>
<li>Your new password must be at least 8 characters with uppercase, lowercase, and numbers</li>
</ol>
</td></tr>
</table>

<p style="color:#64748b;font-size:14px;line-height:1.6;margin:0;">
If you have any questions or need assistance, please contact your administrator at <a href="mailto:rachelle.briscoe@navontech.com" style="color:#3b82f6;">rachelle.briscoe@navontech.com</a>.
</p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#1e293b;padding:24px 40px;text-align:center;">
<p style="color:#d4af37;font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:1px;">NAVON TECHNOLOGIES</p>
<p style="color:#94a3b8;font-size:11px;margin:0;">This is a confidential communication. Unauthorized access is prohibited.</p>
<p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Leesburg, Virginia | navontech.com</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

        const textBody = `Welcome to Navon Technologies Employee Portal, ${employeeName}!\n\nYou have been granted access to the Employee Portal.\n\nYour Login Credentials:\nUsername: ${userDetails.email}\nTemporary Password: ${tempPassword}\nAccess Level: ${roleName}\n\nPortal URL: ${portalUrl}\n\nOn your first login, you will be prompted to create a new password.\n\nIf you need assistance, contact rachelle.briscoe@navontech.com`;

        // Send the email via SES
        await sesClient.send(new SendEmailCommand({
            Source: 'Navon Technologies <rachelle.briscoe@navontech.com>',
            Destination: {
                ToAddresses: [userDetails.email]
            },
            Message: {
                Subject: {
                    Data: '🔐 Welcome to Navon Technologies Employee Portal',
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: htmlBody,
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: textBody,
                        Charset: 'UTF-8'
                    }
                }
            }
        }));

        // Log audit event
        await logAuditEvent({
            userId: username,
            userEmail: userDetails.email,
            eventType: 'USER_INVITE',
            action: `Invitation email sent to ${userDetails.email}`,
            targetUser: username,
            success: true
        });

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                message: 'Invitation sent successfully',
                email: userDetails.email
            })
        };
    } catch (error) {
        console.error('Error inviting user:', error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: 'Failed to send invitation',
                message: error.message
            })
        };
    }
}

async function resetUserPassword(username, data, requesterRole) {
    try {
        if (!['superadmin', 'hr'].includes(requesterRole)) {
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'Only SuperAdmin and HR can reset passwords' })
            };
        }

        const userDetails = await getUserDetails(username);
        const tempPassword = data.tempPassword || 'NavonTemp2024!';
        const portalUrl = data.portalUrl || 'https://navontech.com/#portal';

        // Set a new temporary password
        await cognitoClient.send(new AdminSetUserPasswordCommand({
            UserPoolId: USER_POOL_ID,
            Username: username,
            Password: tempPassword,
            Permanent: false
        }));

        const employeeName = userDetails.attributes?.name || username.split('@')[0];

        const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);padding:40px 40px 30px;text-align:center;">
<h1 style="color:#d4af37;font-size:28px;margin:0 0 8px;font-weight:800;letter-spacing:1px;">NAVON TECHNOLOGIES</h1>
<p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0;letter-spacing:2px;">PASSWORD RESET</p>
</td></tr>

<!-- Gold Divider -->
<tr><td style="background:#d4af37;height:4px;"></td></tr>

<!-- Body -->
<tr><td style="padding:40px;">
<h2 style="color:#1e3a8a;font-size:22px;margin:0 0 20px;">Password Reset, ${employeeName}</h2>
<p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px;">
Your password for the Navon Technologies Employee Portal has been reset by an administrator. Please use the temporary password below to log in and set a new password.
</p>

<!-- Credentials Box -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:24px;">
<h3 style="color:#1e3a8a;font-size:16px;margin:0 0 16px;border-bottom:2px solid #d4af37;padding-bottom:8px;">🔑 New Temporary Password</h3>
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:8px 0;color:#64748b;font-size:14px;width:140px;">Username:</td>
<td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${userDetails.email}</td>
</tr>
<tr>
<td style="padding:8px 0;color:#64748b;font-size:14px;">Temporary Password:</td>
<td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${tempPassword}</td>
</tr>
</table>
</td></tr>
</table>

<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td align="center">
<a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:0.5px;">
Log In Now →
</a>
</td></tr>
</table>

<p style="color:#64748b;font-size:14px;line-height:1.6;margin:0;">
You will be prompted to create a new password on your next login. If you did not request this reset, please contact <a href="mailto:rachelle.briscoe@navontech.com" style="color:#3b82f6;">rachelle.briscoe@navontech.com</a> immediately.
</p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#1e293b;padding:24px 40px;text-align:center;">
<p style="color:#d4af37;font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:1px;">NAVON TECHNOLOGIES</p>
<p style="color:#94a3b8;font-size:11px;margin:0;">This is a confidential communication. Unauthorized access is prohibited.</p>
<p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Leesburg, Virginia | navontech.com</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

        const textBody = `Password Reset - Navon Technologies\n\nHello ${employeeName},\n\nYour password has been reset.\n\nUsername: ${userDetails.email}\nTemporary Password: ${tempPassword}\n\nPortal URL: ${portalUrl}\n\nYou will be prompted to create a new password on your next login.\n\nIf you did not request this, contact rachelle.briscoe@navontech.com immediately.`;

        // Send the email
        await sesClient.send(new SendEmailCommand({
            Source: 'Navon Technologies <rachelle.briscoe@navontech.com>',
            Destination: {
                ToAddresses: [userDetails.email]
            },
            Message: {
                Subject: {
                    Data: '🔑 Password Reset - Navon Technologies Portal',
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: htmlBody,
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: textBody,
                        Charset: 'UTF-8'
                    }
                }
            }
        }));

        // Log audit event
        await logAuditEvent({
            userId: username,
            userEmail: userDetails.email,
            eventType: 'PASSWORD_RESET',
            action: `Password reset for ${userDetails.email}`,
            targetUser: username,
            success: true
        });

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                message: 'Password reset successfully. Email sent.',
                email: userDetails.email
            })
        };
    } catch (error) {
        console.error('Error resetting password:', error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: 'Failed to reset password',
                message: error.message
            })
        };
    }
}
