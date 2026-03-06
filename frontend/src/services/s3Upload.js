// S3 Upload Service for Navon Technologies Employee Portal
// Handles profile pictures and document uploads to S3

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-api-gateway-url';

/**
 * Upload file to S3 bucket via Lambda function
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
        
        console.log('Uploading to S3:', s3Key);
        
        // Convert file to base64
        const base64File = await fileToBase64(file);
        
        // Call Lambda function to upload to S3
        const response = await fetch(`${API_BASE_URL}/upload-to-s3`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'upload',
                fileName: sanitizedFileName,
                folder: folder,
                fileContent: base64File,
                contentType: file.type
            })
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Upload successful:', result.url);
        
        return result.url;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to S3: ' + error.message);
    }
}

/**
 * Convert file to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 encoded file
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the data:image/jpeg;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

/**
 * Delete file from S3 bucket via Lambda function
 * @param {string} fileUrl - The S3 URL to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFromS3(fileUrl) {
    try {
        // If it's a blob URL, just revoke it (not in S3)
        if (fileUrl.startsWith('blob:')) {
            URL.revokeObjectURL(fileUrl);
            return true;
        }
        
        console.log('Deleting from S3:', fileUrl);
        
        // Call Lambda function to delete from S3
        const response = await fetch(`${API_BASE_URL}/delete-from-s3`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileUrl: fileUrl
            })
        });
        
        if (!response.ok) {
            throw new Error(`Delete failed: ${response.statusText}`);
        }
        
        console.log('Delete successful');
        return true;
    } catch (error) {
        console.error('Error deleting from S3:', error);
        throw new Error('Failed to delete file from S3: ' + error.message);
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
