// Cloudinary Configuration for Aurio
// Used for uploading audio files and cover art

const CLOUDINARY_CONFIG = {
    cloudName: 'ddyj2njes',
    uploadPreset: 'aurio_uploads',
    apiKey: '954645892459371',
    // Note: API Secret should never be in client-side code
    // We use unsigned uploads with upload preset instead
};

// Cloudinary Upload URL
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`;

/**
 * Upload file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Function} progressCallback - Called with progress percentage
 * @returns {Promise} - Resolves with Cloudinary response
 */
async function uploadToCloudinary(file, progressCallback) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', 'aurio');
    
    // Add resource type based on file
    const isAudio = file.type.startsWith('audio/');
    if (isAudio) {
        formData.append('resource_type', 'video'); // Cloudinary treats audio as video
    }

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && progressCallback) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressCallback(Math.round(percentComplete));
            }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (error) {
                    reject(new Error('Invalid response from Cloudinary'));
                }
            } else {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
            reject(new Error('Upload aborted'));
        });

        // Send request
        xhr.open('POST', CLOUDINARY_UPLOAD_URL);
        xhr.send(formData);
    });
}

/**
 * Delete file from Cloudinary (requires backend - not implemented)
 * For now, we just remove from database
 */
function deleteFromCloudinary(publicId) {
    console.warn('Delete from Cloudinary requires backend. File remains in cloud but removed from app.');
    return Promise.resolve();
}

/**
 * Get optimized image URL
 * @param {string} url - Original Cloudinary URL
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @returns {string} - Optimized URL
 */
function getOptimizedImageUrl(url, width = 300, height = 300) {
    if (!url || !url.includes('cloudinary.com')) return url;
    
    // Insert transformation parameters
    const parts = url.split('/upload/');
    if (parts.length === 2) {
        return `${parts[0]}/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${parts[1]}`;
    }
    return url;
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.CLOUDINARY_CONFIG = CLOUDINARY_CONFIG;
    window.uploadToCloudinary = uploadToCloudinary;
    window.deleteFromCloudinary = deleteFromCloudinary;
    window.getOptimizedImageUrl = getOptimizedImageUrl;
}
