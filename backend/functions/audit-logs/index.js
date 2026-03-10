const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'AuditLogs';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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
        
        // Get requester info from Cognito claims
        const claims = event.requestContext?.authorizer?.claims;
        const requesterEmail = claims?.email || 'unknown';
        const requesterUsername = claims['cognito:username'] || claims.username || claims.sub;
        
        console.log('Requester:', { email: requesterEmail, username: requesterUsername });

        switch (method) {
            case 'GET':
                // Get audit logs with optional filters
                return await getAuditLogs(event.queryStringParameters || {});
            
            case 'POST':
                // Create audit log entry
                const logData = JSON.parse(event.body);
                return await createAuditLog({
                    ...logData,
                    requesterEmail,
                    requesterUsername
                });
            
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

async function createAuditLog(data) {
    const timestamp = Date.now();
    const eventId = uuidv4();
    
    const auditEntry = {
        eventId,
        timestamp,
        userId: data.userId || data.requesterUsername,
        userEmail: data.userEmail || data.requesterEmail,
        eventType: data.eventType, // LOGIN, LOGOUT, ROLE_CHANGE, USER_CREATE, USER_DELETE, PROFILE_UPDATE, etc.
        action: data.action,
        targetUser: data.targetUser || null,
        targetResource: data.targetResource || null,
        changes: data.changes || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        success: data.success !== false,
        errorMessage: data.errorMessage || null,
        metadata: data.metadata || {},
        ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year retention
    };

    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: auditEntry
    });

    await docClient.send(command);

    return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            message: 'Audit log created',
            eventId
        })
    };
}

async function getAuditLogs(filters) {
    const {
        userId,
        eventType,
        startDate,
        endDate,
        limit = '100'
    } = filters;

    let command;
    
    if (userId) {
        // Query by userId
        const params = {
            TableName: TABLE_NAME,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            Limit: parseInt(limit),
            ScanIndexForward: false // Most recent first
        };

        if (startDate) {
            params.KeyConditionExpression += ' AND #ts >= :startDate';
            params.ExpressionAttributeValues[':startDate'] = parseInt(startDate);
            params.ExpressionAttributeNames = { '#ts': 'timestamp' };
        }

        command = new QueryCommand(params);
    } else if (eventType) {
        // Query by eventType
        const params = {
            TableName: TABLE_NAME,
            IndexName: 'EventTypeIndex',
            KeyConditionExpression: 'eventType = :eventType',
            ExpressionAttributeValues: {
                ':eventType': eventType
            },
            Limit: parseInt(limit),
            ScanIndexForward: false
        };

        if (startDate) {
            params.KeyConditionExpression += ' AND #ts >= :startDate';
            params.ExpressionAttributeValues[':startDate'] = parseInt(startDate);
            params.ExpressionAttributeNames = { '#ts': 'timestamp' };
        }

        command = new QueryCommand(params);
    } else {
        // Scan all logs (limited)
        command = new ScanCommand({
            TableName: TABLE_NAME,
            Limit: parseInt(limit)
        });
    }

    const response = await docClient.send(command);
    
    // Sort by timestamp descending
    const logs = (response.Items || []).sort((a, b) => b.timestamp - a.timestamp);

    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            logs,
            count: logs.length,
            scannedCount: response.ScannedCount
        })
    };
}

// Helper function to log audit events (can be called from other Lambdas)
exports.logAuditEvent = async (eventData) => {
    try {
        const timestamp = Date.now();
        const eventId = uuidv4();
        
        const auditEntry = {
            eventId,
            timestamp,
            ...eventData,
            ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
        };

        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: auditEntry
        });

        await docClient.send(command);
        console.log('Audit log created:', eventId);
        return eventId;
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break main functionality
        return null;
    }
};
