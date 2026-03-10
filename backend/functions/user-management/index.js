const { CognitoIdentityProviderClient, ListUsersCommand, AdminGetUserCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, AdminUpdateUserAttributesCommand, AdminDeleteUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID;

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
        
        // Get requester's role from Cognito groups
        const requesterRole = await getRequesterRole(event);
        
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

async function getRequesterRole(event) {
    // Extract role from Cognito authorizer claims
    const claims = event.requestContext?.authorizer?.claims;
    if (!claims) {
        throw new Error('No authorization claims found');
    }
    
    const groups = claims['cognito:groups'] ? claims['cognito:groups'].split(',') : [];
    
    // Return highest role
    if (groups.includes('superadmin')) return 'superadmin';
    if (groups.includes('hr')) return 'hr';
    if (groups.includes('admin')) return 'admin';
    return 'employee';
}

async function getAllUsers(requesterRole) {
    try {
        // Only superadmin, hr, and admin can list users
        if (!['superadmin', 'hr', 'admin'].includes(requesterRole)) {
            return {
                statusCode: 403,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'Insufficient permissions' })
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

    // Determine role from groups
    const groups = response.UserGroups || [];
    let role = 'employee';
    if (groups.some(g => g.GroupName === 'superadmin')) role = 'superadmin';
    else if (groups.some(g => g.GroupName === 'hr')) role = 'hr';
    else if (groups.some(g => g.GroupName === 'admin')) role = 'admin';

    return {
        username: response.Username,
        email: attributes.email,
        emailVerified: attributes.email_verified === 'true',
        enabled: response.Enabled,
        status: response.UserStatus,
        created: response.UserCreateDate,
        modified: response.UserLastModifiedDate,
        role: role,
        groups: groups.map(g => g.GroupName),
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

            // Remove from old group
            if (targetRole !== 'employee') {
                await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: username,
                    GroupName: targetRole
                }));
            }

            // Add to new group
            if (updateData.newRole !== 'employee') {
                await cognitoClient.send(new AdminAddUserToGroupCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: username,
                    GroupName: updateData.newRole
                }));
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
