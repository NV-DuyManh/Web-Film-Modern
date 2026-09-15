import { cloud_name } from "../utils/Constants";

export const uploadImageToCloudinary = async (imgFile, folderName) => {
    const formData = new FormData();
    formData.append('file', imgFile);
    formData.append('upload_preset', 'WebFilm'); // Unsigned upload preset
    formData.append('cloud_name', cloud_name);

    if (folderName) {
        formData.append('folder', folderName);
    }

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
};

/**
 * Privileged Cloudinary asset deletion is routed securely through the NestJS backend.
 * Browser bundles never possess the Cloudinary API secret.
 */
export const deleteImageFromCloudinary = async (publicId, token = null) => {
    const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/media/${encodeURIComponent(publicId)}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Media deletion failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Delete failed:', error);
        throw error;
    }
};

