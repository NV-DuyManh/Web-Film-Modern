export const getOptimizedUrl = (url, width = 200, height = 200) => {
    if (!url) return '';
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`);
    }
    return url;
};
