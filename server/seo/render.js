import { DEFAULT_SOCIAL_IMAGE, publicImage, safeJsonLd } from '../../src/utils/seo.js';
import { helpQuestions } from '../../src/utils/helpContent.js';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const link = (path, text) => `<a href="${escapeHtml(path)}">${escapeHtml(text)}</a>`;
const name = item => item.otherName || item.title || item.name;

export function renderPageHtml(template, page) {
    const e = escapeHtml;
    const image = publicImage(page.image, DEFAULT_SOCIAL_IMAGE);
    const meta = (name, value, property = false) => `<meta data-rh="true" ${property ? 'property' : 'name'}="${name}" content="${e(value)}">`;
    const head = [
        `<title data-rh="true">${e(page.title)}</title>`, meta('description', page.description), meta('robots', page.robots),
        `<link data-rh="true" rel="canonical" href="${e(page.canonical)}">`,
        meta('og:type', page.kind === 'movie' ? 'video.movie' : 'website', true), meta('og:url', page.canonical, true),
        meta('og:title', page.title, true), meta('og:description', page.description, true), meta('og:image', image, true),
        meta('og:image:alt', page.entity ? name(page.entity) : 'MFILM - Phim hay đỉnh cao', true),
        meta('og:site_name', 'MFILM', true), meta('og:locale', 'vi_VN', true),
        meta('twitter:card', 'summary_large_image'), meta('twitter:title', page.title), meta('twitter:description', page.description), meta('twitter:image', image),
        ...(page.schemas?.length ? [`<script data-rh="true" id="mfilm-schema" type="application/ld+json">${safeJsonLd(page.schemas)}</script>`] : []),
    ].join('\n');
    // The same HTML is delivered to visitors, social previews and crawlers. React replaces
    // this public, non-interactive catalog view when the existing application starts.
    const content = page.kind === 'private' ? '' : renderPublicContent(page);
    return template
        .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
        .replace(/<meta\b[^>]*(?:name="(?:description|robots|keywords|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/gi, '')
        .replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, '')
        .replace('</head>', `${head}\n</head>`)
        .replace(/<div id="root"><\/div>/, `<div id="root">${content}</div>`);
}

function renderPublicContent(page) {
    const e = escapeHtml;
    const heading = page.entity ? name(page.entity) : page.title.replace(/ \| MFILM$/, '');
    const cards = (page.visibleItems || []).map(item => `<li>${link(item.publicPath, name(item))}${item.imgUrl && !item.imgUrl.includes('/assets/') ? `<img src="${e(publicImage(item.imgUrl))}" alt="${e(name(item))}" width="180" height="270" loading="lazy">` : ''}${item.releaseYear ? `<small>${e(item.releaseYear)}</small>` : ''}</li>`).join('');
    const genres = (page.links || []).map(item => link(item.path, item.name)).join(' ');
    const credits = Object.entries(page.credits || {}).map(([key, items]) => items.length ? `<section><h2>${key === 'Actors' ? 'Diễn viên' : key === 'Authors' ? 'Tác giả' : 'Nhân vật'}</h2><p>${items.map(item => link(item.publicPath, item.name)).join(', ')}</p></section>` : '').join('');
    const pagination = page.totalPages > 1 ? `<nav aria-label="Phân trang">${page.pageNumber > 1 ? link(`${page.path}${page.pageNumber > 2 ? `?page=${page.pageNumber - 1}` : ''}`, '← Trang trước') : ''} <span>Trang ${page.pageNumber} / ${page.totalPages}</span> ${page.pageNumber < page.totalPages ? link(`${page.path}?page=${page.pageNumber + 1}`, 'Trang sau →') : ''} ${page.totalPages > page.pageNumber + 1 ? link(`${page.path}?page=${page.totalPages}`, 'Trang cuối') : ''}</nav>` : '';
    const movie = page.entity;
    const facts = page.kind === 'movie' ? `<dl>${[
        ['Tên khác', movie.name !== name(movie) ? movie.name : ''], ['Năm phát hành', movie.releaseYear || movie.year],
        ['Quốc gia', movie.countriesID], ['Thời lượng', movie.duration ? `${movie.duration} phút` : ''], ['Trạng thái', movie.status],
    ].filter(([, value]) => value).map(([label, value]) => `<dt>${e(label)}</dt><dd>${e(value)}</dd>`).join('')}</dl><p>${link(`/xem-phim/${encodeURIComponent(movie.routeSlug)}`, 'Xem phim và chọn tập')}</p>` : '';
    const help = page.kind === 'help' ? `<section><h2>Thuê phim và xem tiếp</h2><p>Thời hạn thuê phim là 30 ngày kể từ khi thanh toán thành công. Kiểm tra ngày hết hạn trong mục Phim Đang Thuê của tài khoản.</p><p>Đăng nhập cùng tài khoản để đồng bộ tiến độ xem giữa các thiết bị khi có kết nối mạng. Dừng phát trước khi chuyển thiết bị để gửi tiến độ mới nhất.</p><h2>Chọn tập phim</h2><p>Danh sách chia thành các nhóm tối đa 120 tập. Mở bộ chọn nhóm và nhập số tập cần tìm.</p><h2>Hỗ trợ khi không phát được phim</h2><p>Thử đổi server, chọn lại tập và kiểm tra kết nối mạng.</p></section>` : '';
    return `<article id="mfilm-public-html" lang="vi"><style>
        #mfilm-public-html{background:#0a0a0f;color:#e2e8f0;min-height:100vh;padding:24px max(20px,calc((100vw - 1280px)/2));font-family:Arial,sans-serif;line-height:1.7;box-sizing:border-box}#mfilm-public-html a{color:#facc15;text-decoration:none}#mfilm-public-html header,#mfilm-public-html nav{display:flex;flex-wrap:wrap;gap:20px;align-items:center}#mfilm-public-html h1{font-size:clamp(26px,4vw,40px);line-height:1.25;color:white}#mfilm-public-html section{margin:28px 0}#mfilm-public-html ul{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:20px}#mfilm-public-html li{display:flex;flex-direction:column;gap:8px}#mfilm-public-html img{width:100%;height:auto;border-radius:12px;object-fit:cover}#mfilm-public-html dt{font-weight:bold}#mfilm-public-html dd{margin-left:0}#mfilm-public-html .catalog-links{display:flex;flex-wrap:wrap;gap:12px}
        </style><header>${link('/', 'MFILM')}${link('/film-new', 'Phim mới')}${link('/singleMovies', 'Phim lẻ')}${link('/series', 'Phim bộ')}${link('/anime', 'Anime')}${link('/actors', 'Diễn viên')}${link('/topic', 'Chủ đề')}${link('/ho-tro', 'Hỗ trợ')}</header><main><h1>${e(heading)}</h1><p>${e(page.description)}</p>${facts}${page.bodyDescription ? `<section><h2>Giới thiệu</h2><p>${e(page.bodyDescription)}</p></section>` : ''}${credits}${cards ? `<section><h2>${page.kind === 'entity' ? 'Phim đã tham gia' : 'Danh sách'}</h2><ul>${cards}</ul></section>` : ''}${help}${page.kind === 'help' ? `<section><h2>Câu hỏi thường gặp</h2>${helpQuestions.map(([question, answer]) => `<h3>${e(question)}</h3><p>${e(answer)}</p>`).join('')}</section>` : ''}${pagination}${genres ? `<section><h2>Khám phá phim</h2><div class="catalog-links">${genres}</div></section>` : ''}${page.kind === 'missing' ? link('/', 'Về trang chủ') : ''}</main><noscript><p>Bật JavaScript để sử dụng trình phát phim, tài khoản và các chức năng tương tác.</p></noscript></article>`;
}
