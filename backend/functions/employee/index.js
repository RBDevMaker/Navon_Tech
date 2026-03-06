const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS preflight' })
        };
    }

    try {
        const { proxy } = event.pathParameters || {};
        const method = event.httpMethod;

        switch (proxy) {
            case 'directory':
                return await handleDirectory(method, event);
            case 'profile':
                return await handleProfile(method, event);
            case 'resources':
                return await handleResources(method, event);
            case 'projects':
                return await handleProjects(method, event);
            default:
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Endpoint not found' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function handleDirectory(method, event) {
    if (method === 'GET') {
        const command = new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'EMPLOYEE#DIRECTORY'
            }
        });

        const result = await dynamodb.send(command);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                employees: result.Items || []
            })
        };
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
}

async function handleProfile(method, event) {
    const body = event.body ? JSON.parse(event.body) : {};
    const { employeeId } = event.queryStringParameters || {};

    if (method === 'GET') {
        // Get employee profile
        if (!employeeId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'employeeId is required' })
            };
        }

        const command = new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': `EMPLOYEE#${employeeId}`,
                ':sk': 'PROFILE'
            }
        });

        const result = await dynamodb.send(command);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                profile: result.Items?.[0] || null
            })
        };
    }

    if (method === 'POST' || method === 'PUT') {
        // Create or update employee profile
        const {
            employeeId: id,
            firstName,
            lastName,
            email,
            phone,
            title,
            department,
            location,
            emergencyContact,
            emergencyPhone,
            profilePicture,
            showInDirectory,
            // HR-managed fields
            salary,
            startDate,
            manager
        } = body;

        if (!id || !email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'employeeId and email are required' })
            };
        }

        const timestamp = new Date().toISOString();
        const profileData = {
            PK: `EMPLOYEE#${id}`,
            SK: 'PROFILE',
            employeeId: id,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            email,
            phone,
            title,
            department,
            location,
            emergencyContact,
            emergencyPhone,
            profilePicture,
            showInDirectory: showInDirectory || false,
            salary,
            startDate,
            manager,
            updatedAt: timestamp,
            createdAt: timestamp
        };

        const command = new PutCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Item: profileData
        });

        await dynamodb.send(command);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Profile saved successfully',
                profile: profileData
            })
        };
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
}

async function handleResources(method, event) {
    // Employee resources
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Resources endpoint - coming soon' })
    };
}

async function handleProjects(method, event) {
    // Employee projects
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Projects endpoint - coming soon' })
    };
}