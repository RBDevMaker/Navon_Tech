const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'CompanyDataTable';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
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
        
        // Get employee ID from path or body
        const pathParts = path.split('/');
        const employeeId = pathParts[pathParts.length - 1];

        switch (method) {
            case 'GET':
                if (employeeId && employeeId !== 'profiles') {
                    // Get single profile
                    return await getProfile(employeeId);
                } else {
                    // Get all profiles
                    return await getAllProfiles();
                }
            
            case 'POST':
                // Create new profile
                return await createProfile(JSON.parse(event.body));
            
            case 'PUT':
                // Update existing profile
                return await updateProfile(employeeId, JSON.parse(event.body));
            
            case 'DELETE':
                // Delete profile (soft delete)
                return await deleteProfile(employeeId);
            
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

async function getProfile(employeeId) {
    try {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                PK: `EMPLOYEE#${employeeId}`,
                SK: 'PROFILE'
            }
        };

        const result = await docClient.send(new GetCommand(params));

        if (!result.Item) {
            return {
                statusCode: 404,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'Profile not found' })
            };
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(result.Item)
        };
    } catch (error) {
        console.error('Error getting profile:', error);
        throw error;
    }
}

async function getAllProfiles() {
    try {
        const params = {
            TableName: TABLE_NAME,
            FilterExpression: 'begins_with(PK, :pk) AND SK = :sk AND active = :active',
            ExpressionAttributeValues: {
                ':pk': 'EMPLOYEE#',
                ':sk': 'PROFILE',
                ':active': true
            }
        };

        const result = await docClient.send(new ScanCommand(params));

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                profiles: result.Items || [],
                count: result.Count || 0
            })
        };
    } catch (error) {
        console.error('Error getting all profiles:', error);
        throw error;
    }
}

async function createProfile(profileData) {
    try {
        const employeeId = profileData.employeeId || profileData.email;
        const timestamp = new Date().toISOString();

        const item = {
            PK: `EMPLOYEE#${employeeId}`,
            SK: 'PROFILE',
            employeeId,
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            department: profileData.department || '',
            title: profileData.title || '',
            location: profileData.location || '',
            emergencyContact: profileData.emergencyContact || '',
            emergencyPhone: profileData.emergencyPhone || '',
            profilePicture: profileData.profilePicture || '',
            employeeGroup: profileData.employeeGroup || '',
            // HR-managed fields
            salary: profileData.salary || '',
            startDate: profileData.startDate || '',
            manager: profileData.manager || '',
            // Employment type fields
            employmentType: profileData.employmentType || 'Employee',
            billableStatus: profileData.billableStatus || 'Billable',
            contractAssignment: profileData.contractAssignment || '',
            contractName: profileData.contractName || '',
            // Personal information
            personalEmail: profileData.personalEmail || '',
            address: profileData.address || '',
            birthdate: profileData.birthdate || '',
            gender: profileData.gender || '',
            // Additional information
            dietaryAllergy: profileData.dietaryAllergy || '',
            shirtSize: profileData.shirtSize || '',
            // Metadata
            createdAt: timestamp,
            updatedAt: timestamp,
            active: true
        };

        const params = {
            TableName: TABLE_NAME,
            Item: item
        };

        await docClient.send(new PutCommand(params));

        return {
            statusCode: 201,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                message: 'Profile created successfully',
                profile: item
            })
        };
    } catch (error) {
        console.error('Error creating profile:', error);
        throw error;
    }
}

async function updateProfile(employeeId, profileData) {
    try {
        const timestamp = new Date().toISOString();

        // Build update expression dynamically
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        const fields = [
            'name', 'email', 'phone', 'department', 'title', 'location',
            'emergencyContact', 'emergencyPhone', 'profilePicture', 'employeeGroup',
            'salary', 'startDate', 'manager',
            'employmentType', 'billableStatus', 'contractAssignment', 'contractName',
            'personalEmail', 'address', 'birthdate', 'gender',
            'dietaryAllergy', 'shirtSize'
        ];

        fields.forEach(field => {
            if (profileData[field] !== undefined) {
                updateExpressions.push(`#${field} = :${field}`);
                expressionAttributeNames[`#${field}`] = field;
                expressionAttributeValues[`:${field}`] = profileData[field];
            }
        });

        // Always update the timestamp
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = timestamp;

        const params = {
            TableName: TABLE_NAME,
            Key: {
                PK: `EMPLOYEE#${employeeId}`,
                SK: 'PROFILE'
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.send(new UpdateCommand(params));

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                message: 'Profile updated successfully',
                profile: result.Attributes
            })
        };
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

async function deleteProfile(employeeId) {
    try {
        // Soft delete - just mark as inactive
        const params = {
            TableName: TABLE_NAME,
            Key: {
                PK: `EMPLOYEE#${employeeId}`,
                SK: 'PROFILE'
            },
            UpdateExpression: 'SET active = :active, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':active': false,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };

        await docClient.send(new UpdateCommand(params));

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                message: 'Profile deleted successfully'
            })
        };
    } catch (error) {
        console.error('Error deleting profile:', error);
        throw error;
    }
}
