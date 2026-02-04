// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
    cloudName: 'ddyj2njes',
    uploadPreset: 'aurio_unsigned',
    apiKey: '123456789012345'
};

// Upload Audio File to Cloudinary
async function uploadAudio(file, onProgress) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('resource_type', 'video'); // Audio files use 'video' resource type
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const data = await response.json();
        return {
            url: data.secure_url,
            publicId: data.public_id,
            duration: data.duration,
            format: data.format,
            bytes: data.bytes
        };
    } catch (error) {
        console.error('Audio upload error:', error);
        throw error;
    }
}

// Upload Image File to Cloudinary
async function uploadImage(file, onProgress) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('resource_type', 'image');
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const data = await response.json();
        return {
            url: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
            format: data.format,
            bytes: data.bytes
        };
    } catch (error) {
        console.error('Image upload error:', error);
        throw error;
    }
}

// Extract Audio Metadata
async function extractAudioMetadata(file) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);
        
        audio.addEventListener('loadedmetadata', () => {
            const metadata = {
                duration: Math.round(audio.duration),
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            };
            
            URL.revokeObjectURL(objectUrl);
            resolve(metadata);
        });
        
        audio.addEventListener('error', (error) => {
            URL.revokeObjectURL(objectUrl);
            reject(error);
        });
        
        audio.src = objectUrl;
    });
}

// Format Duration (seconds to mm:ss)
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Parse Filename for Metadata
function parseFilenameMetadata(filename) {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Try to parse patterns like "Artist - Song Title" or "Song Title - Artist"
    const parts = nameWithoutExt.split('-').map(p => p.trim());
    
    if (parts.length >= 2) {
        return {
            title: parts[1],
            artist: parts[0]
        };
    }
    
    return {
        title: nameWithoutExt,
        artist: 'Unknown Artist'
    };
}

// Generate Cover Image URL with transformations
function getCoverImageUrl(publicId, options = {}) {
    const {
        width = 300,
        height = 300,
        quality = 'auto',
        format = 'jpg'
    } = options;
    
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
}

// Generate Thumbnail URL
function getThumbnailUrl(publicId, size = 150) {
    return getCoverImageUrl(publicId, {
        width: size,
        height: size,
        quality: 'auto',
        format: 'jpg'
    });
}

// Optimize Audio URL
function getOptimizedAudioUrl(publicId) {
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/q_auto/${publicId}`;
}

// Delete Resource from Cloudinary (requires backend/Cloud Function)
async function deleteResource(publicId, resourceType = 'image') {
    // This would typically be done via a Cloud Function for security
    // Frontend cannot directly delete from Cloudinary
    console.log('Delete request for:', publicId, resourceType);
    // Would call your Cloud Function endpoint here
}

// Export functions
window.cloudinaryService = {
    uploadAudio,
    uploadImage,
    extractAudioMetadata,
    formatDuration,
    parseFilenameMetadata,
    getCoverImageUrl,
    getThumbnailUrl,
    getOptimizedAudioUrl,
    deleteResource,
    config: CLOUDINARY_CONFIG
};
