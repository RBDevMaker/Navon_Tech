// Temporarily disabled for build - aws-amplify not configured
// import { uploadData, getUrl, remove } from 'aws-amplify/storage';

class S3Service {
    constructor() {
        this.baseUrl = import.meta.env.VITE_S3_BASE_URL || '';
        this.bucketName = import.meta.env.VITE_S3_BUCKET || '';
    }

    /**
     * Get optimized image URL with responsive sizing
     * @param {string} imagePath - Path to image in S3
     * @param {string} size - Size variant (thumbnail, medium, large, original)
     * @param {string} format - Image format (webp, jpg, png)
     * @returns {string} Optimized image URL
     */
    getImageUrl(imagePath, size = 'medium', format = 'webp') {
        if (!imagePath) return '';

        // Remove leading slash if present
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

        // For CloudFront with image optimization
        if (this.baseUrl) {
            return `${this.baseUrl}/${cleanPath}?size=${size}&format=${format}`;
        }

        // Fallback to direct S3 URL
        return `https://${this.bucketName}.s3.amazonaws.com/${cleanPath}`;
    }

    /**
     * Get responsive image sources for different screen sizes
     * @param {string} imagePath - Path to image in S3
     * @returns {object} Object with srcSet and sizes for responsive images
     */
    getResponsiveImageSources(imagePath) {
        if (!imagePath) return { src: '', srcSet: '', sizes: '' };

        return {
            src: this.getImageUrl(imagePath, 'medium', 'jpg'), // Fallback
            srcSet: `
        ${this.getImageUrl(imagePath, 'thumbnail', 'webp')} 300w,
        ${this.getImageUrl(imagePath, 'medium', 'webp')} 768w,
        ${this.getImageUrl(imagePath, 'large', 'webp')} 1200w,
        ${this.getImageUrl(imagePath, 'original', 'webp')} 1920w
      `,
            sizes: '(max-width: 300px) 300px, (max-width: 768px) 768px, (max-width: 1200px) 1200px, 1920px'
        };
    }

    /**
     * Upload image to S3 (for admin/employee use)
     * @param {File} file - File to upload
     * @param {string} folder - S3 folder path
     * @returns {Promise<string>} Uploaded file key
     */
    async uploadImage(file, folder = 'uploads') {
        try {
            const fileExtension = file.name.split('.').pop();
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

            const result = await uploadData({
                key: fileName,
                data: file,
                options: {
                    contentType: file.type,
                    metadata: {
                        originalName: file.name
                    }
                }
            }).result;

            return result.key;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    /**
     * Delete image from S3
     * @param {string} imageKey - S3 object key
     * @returns {Promise<void>}
     */
    async deleteImage(imageKey) {
        try {
            await remove({ key: imageKey });
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }

    /**
     * Get presigned URL for private images
     * @param {string} imageKey - S3 object key
     * @param {number} expires - URL expiration in seconds (default: 1 hour)
     * @returns {Promise<string>} Presigned URL
     */
    async getPrivateImageUrl(imageKey, expires = 3600) {
        try {
            const linkToStorageFile = await getUrl({
                key: imageKey,
                options: {
                    expiresIn: expires
                }
            });
            return linkToStorageFile.url;
        } catch (error) {
            console.error('Error getting private image URL:', error);
            throw error;
        }
    }
}

export default new S3Service();