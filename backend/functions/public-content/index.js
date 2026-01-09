const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

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
            case 'content':
                return await handleContent(method, event);
            case 'solutions':
                return await handleSolutions(method, event);
            case 'partners':
                return await handlePartners(method, event);
            case 'careers':
                return await handleCareers(method, event);
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

async function handleContent(method, event) {
    if (method === 'GET') {
        const command = new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'CONTENT#PUBLIC'
            }
        });

        const result = await dynamodb.send(command);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                content: result.Items || []
            })
        };
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
}

async function handleSolutions(method, event) {
    if (method === 'GET') {
        const command = new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'SOLUTIONS'
            }
        });

        const result = await dynamodb.send(command);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                solutions: result.Items || []
            })
        };
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
}

async function handlePartners(method, event) {
    if (method === 'GET') {
        const command = new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'PARTNERS'
            }
        });

        const result = await dynamodb.send(command);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                partners: result.Items || []
            })
        };
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
}

async function handleCareers(method, event) {
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