export const getOptimizedUrl = (url, width = 400, height = 600, type = 'poster') => {
    if (!url) return '';
    
    // Cloudinary natively supports transformations
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        const presets = {
            poster:  `w_${width},h_${height},c_fill,f_webp,q_auto:eco`,
            banner:  `w_1280,h_720,c_fill,f_webp,q_auto:eco`,
            thumb:   `w_${width},h_${height},c_fill,f_webp,q_auto:low`,
            avatar:  `w_${width},h_${height},c_fill,f_webp,q_auto`,
        };
        const transform = presets[type] || presets.poster;
        return url.replace('/upload/', `/upload/${transform}/`);
    }

    // For third-party URLs (Firebase, PhimAPI, Ophim, etc.), use wsrv.nl image proxy
    // to force resize and WebP conversion on the fly.
    // This saves ~19MB of image payload for APIs that return raw uncompressed images.
    if (url.startsWith('http')) {
        const encoded = encodeURIComponent(url);
        if (type === 'banner') {
            return `https://wsrv.nl/?url=${encoded}&w=1280&h=720&fit=cover&output=webp&q=60`;
        } else if (type === 'thumb') {
            return `https://wsrv.nl/?url=${encoded}&w=${width}&h=${height}&fit=cover&output=webp&q=50`;
        } else {
            return `https://wsrv.nl/?url=${encoded}&w=${width}&h=${height}&fit=cover&output=webp&q=60`;
        }
    }
    
    return url;
};
