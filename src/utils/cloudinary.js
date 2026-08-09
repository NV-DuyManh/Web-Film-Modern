export const getOptimizedUrl = (url, width = 400, height = 600, type = 'poster') => {
    if (!url) return '';
    if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;

    const presets = {
        poster:  `w_${width},h_${height},c_fill,f_webp,q_auto:eco`,
        banner:  `w_1280,h_720,c_fill,f_webp,q_auto:eco`,
        thumb:   `w_${width},h_${height},c_fill,f_webp,q_auto:low`,
        avatar:  `w_${width},h_${height},c_fill,f_webp,q_auto`,
    };

    const transform = presets[type] || presets.poster;
    return url.replace('/upload/', `/upload/${transform}/`);
};
