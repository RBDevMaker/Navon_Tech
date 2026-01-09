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
    // Employee profile management
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Profile endpoint - coming soon' })
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