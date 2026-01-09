const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

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
            case 'jobs':
                return await handleJobs(method, event);
            case 'applications':
                return await handleApplications(method, event);
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

async function handleJobs(method, event) {
    if (method === 'GET') {
        const command = new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': 'CAREERS',
                ':sk': 'JOB#'
            }
        });

        const result = await dynamodb.send(command);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                jobs: result.Items || []
            })
        };
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
}

async function handleApplications(method, event) {
    if (method === 'POST') {
        const body = JSON.parse(event.body || '{}');

        // Handle job application submission
        const application = {
            PK: 'APPLICATIONS',
            SK: `APP#${Date.now()}`,
            ...body,
            submittedAt: new Date().toISOString()
        };

        const command = new PutCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Item: application
        });

        await dynamodb.send(command);

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'Application submitted successfully',
                applicationId: application.SK
            })
        };
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
}