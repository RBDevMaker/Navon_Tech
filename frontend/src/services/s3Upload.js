// S3 Upload Service for Navon Technologies Employee Portal
// Handles profile pictures and document uploads to S3

const S3_BUCKET = 'navon-tech-images';
const S3_REGION = 'us-east-1';
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

/**
 * Upload file to S3 bucket
 * @param {File} file - The file to upload
 * @param {string} folder - The S3 folder path (e.g., 'Team-Directory', 'Documents')
 * @param {string} fileName - Optional custom file name
 * @returns {Promise<string>} - The S3 URL of the uploaded file
 */
export async function uploadToS3(file, folder, fileName = null) {
    try {
        // Generate unique filename if not provided
        const timestamp = Date.now();
        const sanitizedFileName = fileName || `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const s3Key = `${folder}/${sanitizedFileName}`;
        
        // For now, return the local blob URL for immediate preview
        // In production, this would use AWS SDK or presigned URLs
        const localUrl = URL.createObjectURL(file);
        
        console.log('File would be uploaded to S3:', `${S3_BASE_URL}/${s3Key}`);
        console.log('Using local preview URL:', localUrl);
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return local URL for preview (in production, return actual S3 URL)
        return localUrl;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
}

/**
 * Delete file from S3 bucket
 * @param {string} fileUrl - The S3 URL or blob URL to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFromS3(fileUrl) {
    try {
        console.log('File would be deleted from S3:', fileUrl);
        
        // If it's a blob URL, revoke it
        if (fileUrl.startsWith('blob:')) {
            URL.revokeObjectURL(fileUrl);
        }
        
        // Simulate deletion delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return true;
    } catch (error) {
        console.error('Error deleting from S3:', error);
        throw new Error('Failed to delete file from S3');
    }
}

/**
 * Upload profile picture to Team Directory folder
 * @param {File} file - The image file
 * @param {string} employeeId - Employee identifier
 * @param {string} oldImageUrl - Optional: URL of old image to delete
 * @returns {Promise<string>} - The S3 URL
 */
export async function uploadProfilePicture(file, employeeId, oldImageUrl = null) {
    // Delete old image if it exists
    if (oldImageUrl) {
        try {
            await deleteFromS3(oldImageUrl);
            console.log('Old profile picture deleted');
        } catch (error) {
            console.warn('Failed to delete old profile picture:', error);
            // Continue with upload even if delete fails
        }
    }
    
    const fileName = `profile-${employeeId}-${Date.now()}.${file.name.split('.').pop()}`;
    return uploadToS3(file, 'Team-Directory', fileName);
}

/**
 * Upload document to Documents folder
 * @param {File} file - The document file
 * @param {string} category - Document category (e.g., 'HR', 'Compliance')
 * @returns {Promise<string>} - The S3 URL
 */
export async function uploadDocument(file, category) {
    const fileName = `${category}-${Date.now()}-${file.name}`;
    return uploadToS3(file, `Documents/${category}`, fileName);
}

/**
 * Check if user has upload privileges
 * @param {string} userRole - User's role (employee, hr, admin)
 * @param {string} uploadType - Type of upload (profile, document)
 * @returns {boolean}
 */
export function canUpload(userRole, uploadType) {
    if (uploadType === 'profile') {
        // All users can upload their own profile picture
        return true;
    }
    
    if (uploadType === 'document') {
        // Only HR and Admin can upload documents
        return userRole === 'hr' || userRole === 'admin';
    }
    
    return false;
}

export default {
    uploadToS3,
    uploadProfilePicture,
    uploadDocument,
    canUpload,
    deleteFromS3
};
