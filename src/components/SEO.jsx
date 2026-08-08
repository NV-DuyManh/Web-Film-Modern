import { Helmet } from 'react-helmet-async';

/**
 * SEO Component - Quản lý meta tags động cho từng trang
 * 
 * @param {string} title - Tiêu đề trang
 * @param {string} description - Mô tả trang
 * @param {string} image - URL ảnh OG (Open Graph)
 * @param {string} url - URL canonical của trang
 * @param {string} type - Loại OG (website, video.movie, article...)
 * @param {object} extra - Các meta tags bổ sung { property: content }
 */
function SEO({ 
    title = 'MFILM - Xem Phim Online Miễn Phí', 
    description = 'MFILM - Trang xem phim online chất lượng cao, phim mới cập nhật nhanh nhất. Phim lẻ, phim bộ, phim chiếu rạp, anime, phim Hàn Quốc, Trung Quốc, Nhật Bản vietsub.', 
    image = 'https://mfilm.online/favicon.svg',
    url,
    type = 'website',
    extra = {}
}) {
    const siteUrl = 'https://mfilm.online';
    const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
    const fullTitle = title === 'MFILM - Xem Phim Online Miễn Phí' 
        ? title 
        : `${title} | MFILM`;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="MFILM" />
            <meta property="og:locale" content="vi_VN" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Extra meta tags */}
            {Object.entries(extra).map(([property, content]) => (
                <meta key={property} property={property} content={content} />
            ))}
        </Helmet>
    );
}

export default SEO;
