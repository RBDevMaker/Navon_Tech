const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'navon-tech-images';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { action, fileName, folder, fileContent, contentType, fileUrl } = body;

        if (action === 'upload') {
            // Upload file to S3
            const s3Key = `${folder}/${fileName}`;
            
            // Convert base64 to buffer
            const fileBuffer = Buffer.from(fileContent, 'base64');
            
            const uploadParams = {
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: contentType,
                ACL: 'public-read'
            };

            await s3Client.send(new PutObjectCommand(uploadParams));

            const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'File uploaded successfully',
                    url: fileUrl,
                    key: s3Key
                })
            };
        } else if (action === 'delete') {
            // Delete file from S3
            // Extract S3 key from URL
            let s3Key = fileUrl;
            if (fileUrl.includes('amazonaws.com')) {
                const url = new URL(fileUrl);
                s3Key = url.pathname.substring(1); // Remove leading slash
            }

            const deleteParams = {
                Bucket: BUCKET_NAME,
                Key: s3Key
            };

            await s3Client.send(new DeleteObjectCommand(deleteParams));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'File deleted successfully',
                    key: s3Key
                })
            };
        } else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid action. Use "upload" or "delete"' })
            };
        }
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
