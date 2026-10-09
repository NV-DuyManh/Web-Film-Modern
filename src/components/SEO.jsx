import { useContext, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthContext } from '../contexts/AuthProvider';
import { routeSegment } from '../utils/nameRoutes';
import { STATIC_SEO, SITE_TITLE, SITE_DESCRIPTION, canonicalUrl, pageTitle, descriptionText, publicImage, robotsForPath, breadcrumbSchema, safeJsonLd } from '../utils/seo';

export default function SEO({ title, description, image, url, type = 'website', extra = {}, noindex = false, schema = [], items = [], fallback = false }) {
    useLayoutEffect(() => {
        // Helmet 3 uses React 19's metadata hoisting, which does not adopt the
        // server's legacy Helmet tags. Keep them until this page's SEO mounts,
        // then leave only the metadata owned by React for later navigation.
        document.head.querySelectorAll('title[data-rh="true"], meta[data-rh="true"], link[data-rh="true"], script[data-rh="true"]').forEach(tag => tag.remove());
    }, []);
    const location = useLocation();
    const { isLogin } = useContext(AuthContext);
    const base = STATIC_SEO[location.pathname];
    const canonical = canonicalUrl(`${url || location.pathname}${location.search}`);
    const page = new URL(canonical).searchParams.get('page');
    const fullTitle = pageTitle(`${base?.[0] || title || SITE_TITLE}${page ? ` - Trang ${page}` : ''}`);
    const summary = descriptionText(base?.[1] || description || SITE_DESCRIPTION);
    const picture = publicImage(image);
    const robots = robotsForPath(location.pathname, { noindex, search: location.search, admin: isLogin?.role === 'admin' });
    const schemas = Array.isArray(schema) ? [...schema] : [schema];
    if (!fallback && robots.startsWith('index') && location.pathname === '/') schemas.push({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${canonicalUrl('/')}#website`, name: 'MFILM', alternateName: ['MFilm', 'ManhFilm'], url: canonicalUrl('/'), inLanguage: 'vi' });
    else if (!fallback && robots.startsWith('index')) schemas.push(breadcrumbSchema([['MFILM', '/'], [title || base?.[0] || 'Phim', canonical]]));
    if (items.length) schemas.push({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.otherName || item.title || item.name, url: canonicalUrl(item.publicPath || `/phim/${routeSegment(item)}`) })) });

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={summary} />
            <meta name="robots" content={robots} />
            <link rel="canonical" href={canonical} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonical} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={summary} />
            <meta property="og:image" content={picture} />
            <meta property="og:image:alt" content={title || 'MFILM - Phim hay đỉnh cao'} />
            <meta property="og:site_name" content="MFILM" />
            <meta property="og:locale" content="vi_VN" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={canonical} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={summary} />
            <meta name="twitter:image" content={picture} />
            {Object.entries(extra).filter(([, content]) => content).map(([property, content]) => <meta key={property} property={property} content={content} />)}
            {schemas.length > 0 && robots.startsWith('index') && <script id="mfilm-schema" type="application/ld+json">{safeJsonLd(schemas)}</script>}
        </Helmet>
    );
}
