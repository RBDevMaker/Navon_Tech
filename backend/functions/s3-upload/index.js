const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CopyObjectCommand } = require('@aws-sdk/client-s3');

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
        const { action, fileName, folder, fileContent, contentType, fileUrl, prefix } = body;

        if (action === 'list') {
            // List folders and files in S3
            const listParams = {
                Bucket: BUCKET_NAME,
                Prefix: prefix || '',
                Delimiter: '/'
            };

            const data = await s3Client.send(new ListObjectsV2Command(listParams));

            // Extract folders (CommonPrefixes) and files (Contents)
            const folders = (data.CommonPrefixes || []).map(p => ({
                name: p.Prefix.replace(prefix || '', '').replace('/', ''),
                type: 'folder',
                prefix: p.Prefix
            }));

            const files = (data.Contents || []).map(obj => ({
                name: obj.Key.split('/').pop(),
                key: obj.Key,
                size: obj.Size,
                lastModified: obj.LastModified,
                type: 'file',
                url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${obj.Key}`
            })).filter(f => f.name); // Filter out folder markers

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    folders,
                    files,
                    prefix: prefix || ''
                })
            };
        } else if (action === 'upload') {
            // Upload file to S3
            const s3Key = `${folder}/${fileName}`;
            
            // Convert base64 to buffer
            const fileBuffer = Buffer.from(fileContent, 'base64');
            
            const uploadParams = {
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: contentType,
                ContentDisposition: contentType === 'application/pdf' ? 'inline' : undefined
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
                s3Key = decodeURIComponent(url.pathname.substring(1)); // Remove leading slash and decode
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
        } else if (action === 'move') {
            // Move file from one folder to another (e.g., Team-Directory to Inactive-Employees)
            const { sourceKey, destinationFolder } = body;
            
            if (!sourceKey || !destinationFolder) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'sourceKey and destinationFolder are required for move action' })
                };
            }
            
            // Extract filename from source key
            const fileName = sourceKey.split('/').pop();
            const destinationKey = `${destinationFolder}/${fileName}`;
            
            // Copy the file to new location
            const copyParams = {
                Bucket: BUCKET_NAME,
                CopySource: `${BUCKET_NAME}/${sourceKey}`,
                Key: destinationKey
            };
            
            await s3Client.send(new CopyObjectCommand(copyParams));
            
            // Delete the original file
            const deleteParams = {
                Bucket: BUCKET_NAME,
                Key: sourceKey
            };
            
            await s3Client.send(new DeleteObjectCommand(deleteParams));
            
            const newFileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${destinationKey}`;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'File moved successfully',
                    oldKey: sourceKey,
                    newKey: destinationKey,
                    newUrl: newFileUrl
                })
            };
        } else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid action. Use "list", "upload", "delete", or "move"' })
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
