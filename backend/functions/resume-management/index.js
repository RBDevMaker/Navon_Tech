const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'ResumeMetadata';

// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const path = event.path;
        const method = event.httpMethod;
        const body = event.body ? JSON.parse(event.body) : {};

        // Route requests
        if (method === 'GET' && path.includes('/resumes')) {
            return await listResumes(event.queryStringParameters);
        } else if (method === 'GET' && path.includes('/resume/')) {
            const resumeId = path.split('/').pop();
            return await getResume(resumeId);
        } else if (method === 'POST' && path.includes('/resume')) {
            return await createResume(body);
        } else if (method === 'PUT' && path.includes('/resume/')) {
            const resumeId = path.split('/').pop();
            return await updateResume(resumeId, body);
        } else if (method === 'DELETE' && path.includes('/resume/')) {
            const resumeId = path.split('/').pop();
            return await deleteResume(resumeId);
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Route not found' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};

// List all resumes with optional filters
async function listResumes(queryParams = {}) {
    try {
        const { department, stage, limit = 50 } = queryParams;

        let command;

        if (department) {
            // Query by department using GSI
            command = new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'DepartmentIndex',
                KeyConditionExpression: 'department = :dept',
                ExpressionAttributeValues: {
                    ':dept': department
                },
                Limit: parseInt(limit),
                ScanIndexForward: false // Most recent first
            });
        } else if (stage) {
            // Query by stage using GSI
            command = new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'StageIndex',
                KeyConditionExpression: 'stage = :stage',
                ExpressionAttributeValues: {
                    ':stage': stage
                },
                Limit: parseInt(limit),
                ScanIndexForward: false
            });
        } else {
            // Scan all resumes
            command = new ScanCommand({
                TableName: TABLE_NAME,
                Limit: parseInt(limit)
            });
        }

        const response = await docClient.send(command);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                resumes: response.Items || [],
                count: response.Items?.length || 0
            })
        };

    } catch (error) {
        console.error('Error listing resumes:', error);
        throw error;
    }
}

// Get a single resume by ID
async function getResume(resumeId) {
    try {
        // We need to query since we don't have the sort key
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'resumeId = :id',
            ExpressionAttributeValues: {
                ':id': resumeId
            }
        });

        const response = await docClient.send(command);

        if (!response.Items || response.Items.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Resume not found' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response.Items[0])
        };

    } catch (error) {
        console.error('Error getting resume:', error);
        throw error;
    }
}

// Create a new resume entry
async function createResume(data) {
    try {
        const resumeId = `resume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const receivedDate = new Date().toISOString();

        const resume = {
            resumeId,
            receivedDate,
            candidateName: data.candidateName,
            email: data.email,
            phone: data.phone || '',
            position: data.position,
            department: data.department,
            stage: data.stage || 'New',
            s3Key: data.s3Key || '',
            notes: data.notes || '',
            experience: data.experience || '',
            createdAt: receivedDate,
            updatedAt: receivedDate
        };

        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: resume
        });

        await docClient.send(command);

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'Resume created successfully',
                resume
            })
        };

    } catch (error) {
        console.error('Error creating resume:', error);
        throw error;
    }
}

// Update a resume entry
async function updateResume(resumeId, data) {
    try {
        // First get the existing resume to get the receivedDate (sort key)
        const getCommand = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'resumeId = :id',
            ExpressionAttributeValues: {
                ':id': resumeId
            }
        });

        const getResponse = await docClient.send(getCommand);

        if (!getResponse.Items || getResponse.Items.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Resume not found' })
            };
        }

        const existingResume = getResponse.Items[0];

        // Build update expression
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        const updatableFields = ['candidateName', 'email', 'phone', 'position', 'department', 'stage', 's3Key', 'notes', 'experience'];

        updatableFields.forEach(field => {
            if (data[field] !== undefined) {
                updateExpressions.push(`#${field} = :${field}`);
                expressionAttributeNames[`#${field}`] = field;
                expressionAttributeValues[`:${field}`] = data[field];
            }
        });

        if (updateExpressions.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No fields to update' })
            };
        }

        // Add updatedAt
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                resumeId: resumeId,
                receivedDate: existingResume.receivedDate
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        });

        const response = await docClient.send(command);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Resume updated successfully',
                resume: response.Attributes
            })
        };

    } catch (error) {
        console.error('Error updating resume:', error);
        throw error;
    }
}

// Delete a resume entry
async function deleteResume(resumeId) {
    try {
        // First get the resume to get the receivedDate (sort key)
        const getCommand = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'resumeId = :id',
            ExpressionAttributeValues: {
                ':id': resumeId
            }
        });

        const getResponse = await docClient.send(getCommand);

        if (!getResponse.Items || getResponse.Items.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Resume not found' })
            };
        }

        const existingResume = getResponse.Items[0];

        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                resumeId: resumeId,
                receivedDate: existingResume.receivedDate
            }
        });

        await docClient.send(command);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Resume deleted successfully'
            })
        };

    } catch (error) {
        console.error('Error deleting resume:', error);
        throw error;
    }
}
