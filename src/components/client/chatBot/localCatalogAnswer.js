import { searchTV, detectCountryInQuery, isMovieMatchCountry, getMoviePlanInfo, detectPlanInQuery, isPlanAppropriateQuery, filterMoviesByEntitlement, getFranchiseStats } from './ChatBotCore.jsx';
import { routeSegment, findMovieReference } from '../../../utils/nameRoutes.js';

const result = reply => ({ reply, source: 'catalog', confidence: 1 });
const title = movie => movie.otherName || movie.name || 'Phim';
const link = movie => `[${title(movie)}](/phim/${routeSegment(movie)})`;
const episodeText = movie => Number(movie.endEpisode) > 0 ? `${movie.endEpisode} tập theo thông tin phim` : 'Số tập đang cập nhật';

export function catalogContext(movies = [], plans = [], userPlanInfo = {}, currentMovie) {
    // Views change constantly; only changes relevant to factual answers invalidate memory.
    const data = [movies.map(m => [m.id, m.name, m.otherName, m.endEpisode, m.planID, m.status, m.updatedAt]), plans.map(p => [p.id, p.name, p.level]), userPlanInfo.name, userPlanInfo.level, currentMovie?.id];
    let hash = 2166136261;
    for (const character of JSON.stringify(data)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    return `catalog-v1-${hash >>> 0}`;
}

export function answerFromCatalog({ prompt, movies = [], categories = [], actors = [], authors = [], characters = [], plans = [], currentMovie, history = [], userPlanInfo = { name: 'FREE', level: 0 }, isLogin, catalogReady = true }) {
    let q = searchTV(prompt).replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (/\b(goi cua toi|goi hien tai|toi dang dung goi|tai khoan.*goi gi)\b/.test(q) && !/phim|goi y|xem/.test(q)) {
        return result(isLogin ? `Gói hiện tại của bạn là **${userPlanInfo.name}**. Xem chi tiết tại [Gói thành viên](/upgrade-vip).` : 'Bạn cần đăng nhập để mình kiểm tra gói hiện tại của tài khoản.');
    }
    const previousUser = [...history].reverse().find(message => message.sender === 'user');
    const continuation = /^(tiep|them|nua|goi y tiep|phim khac|them phim|doi phim)( di| nhe| nha| nua)?$/.test(q);
    if (continuation) {
        if (!previousUser) return null;
        q = searchTV(previousUser.text);
    }
    const excluded = new Set(continuation ? history.flatMap(message => message.sender === 'ai' ? [...String(message.text).matchAll(/\/phim\/([^\s)\]?#]+)/g)].map(match => match[1]) : []) : []);
    const genreNames = categories.map(category => searchTV(category.name)).filter(name => ` ${q} `.includes(` ${name} `));
    const queryTitles = movies.filter(movie => [movie.name, movie.otherName].some(name => {
        const normalized = searchTV(name).trim();
        // A film named "Phim Hài" must not capture every request for "phim hài hước".
        if (genreNames.some(genre => genre.includes(normalized.replace(/^phim /, '')))) return false;
        return normalized.length >= 3 && (` ${q} `.includes(` ${normalized} `) || (q.length >= 4 && normalized === q));
    }));
    // A short franchise name is useful for discovery, but never guesses a single film for facts.
    const stripped = q.replace(/\b(goi y|de xuat|tim|cho toi|toi muon|bao nhieu tap|may tap|noi dung|tom tat|gioi thieu|thong tin|quoc gia|nuoc nao|nam nao|ra mat|chieu|dien vien|dao dien|la ai|ai dong|thuoc goi|goi gi|phim|xem|co|khong|nhe|nha|di|voi|giup|ban)\b/g, '').replace(/\s+/g, ' ').trim();
    const partial = queryTitles.length ? queryTitles : stripped.length >= 3 ? movies.filter(movie => [movie.name, movie.otherName].some(name => searchTV(name).includes(stripped))) : [];
    let target = queryTitles.length === 1 ? queryTitles[0] : partial.length === 1 ? partial[0] : null;
    if (/\b(phim nay|bo nay|phim dang xem)\b/.test(q)) target = currentMovie;
    if (!target && /\b(phim do|bo do)\b/.test(q)) {
        const recent = [...history].reverse().find(message => message.sender === 'ai' && /\/phim\//.test(message.text));
        const references = [...String(recent?.text || '').matchAll(/\/phim\/([^\s)\]?#]+)/g)];
        if (references.length === 1) target = findMovieReference(movies, references[0][1]);
    }
    const fact = /\b(bao nhieu tap|may tap|noi dung|tom tat|gioi thieu|ke ve|thong tin|quoc gia|nuoc nao|nam nao|ra mat|dien vien|ai dong|dao dien|the loai|thoi luong|bao nhieu phut|thuoc goi|goi gi)\b/.test(q);
    if (target && fact && !/\b(ket thuc|giai thich|tai sao|so sanh|phan tich|review|danh gia)\b/.test(q)) {
        const lines = [`**${title(target)}**`, link(target)];
        if (/bao nhieu tap|may tap|thong tin/.test(q)) lines.push(episodeText(target));
        if (/quoc gia|nuoc nao|thong tin/.test(q)) lines.push(`Quốc gia: ${target.countriesID || target.country || 'Đang cập nhật'}`);
        if (/nam nao|ra mat|thong tin/.test(q)) lines.push(`Năm: ${target.releaseYear || target.year || 'Đang cập nhật'}`);
        if (/noi dung|tom tat|gioi thieu|ke ve|thong tin/.test(q)) lines.push(target.description ? String(target.description).replace(/<[^>]*>/g, '').slice(0, 1500) : 'Giới thiệu đang cập nhật.');
        if (/the loai|thong tin/.test(q)) lines.push(`Thể loại: ${categories.filter(c => (target.listCategory || []).includes(c.id)).map(c => c.name).join(', ') || 'Đang cập nhật'}`);
        if (/dien vien|ai dong/.test(q)) lines.push(`Diễn viên: ${actors.filter(actor => (target.listActor || target.actors || target.actor || []).includes(actor.id)).map(actor => actor.name).join(', ') || 'Đang cập nhật'}`);
        if (/dao dien/.test(q)) lines.push(`Đạo diễn/tác giả: ${authors.filter(author => (target.listAuthor || []).includes(author.id) || target.author === author.id).map(author => author.name).join(', ') || 'Đang cập nhật'}`);
        if (/thoi luong|bao nhieu phut/.test(q)) lines.push(`Thời lượng: ${target.duration ? `${target.duration} phút` : 'Đang cập nhật'}`);
        if (/thuoc goi|goi gi/.test(q)) lines.push(`Gói xem: ${getMoviePlanInfo(target, plans).planName}`);
        return result(lines.join('\n'));
    }
    if (/\b(web|mfilm|he thong)\b.*\b(bao nhieu phim|may phim)\b|\b(bao nhieu phim|may phim)\b.*\b(web|mfilm|he thong)\b/.test(q)) return result(catalogReady ? `Kho phim MFILM hiện có **${movies.length} phim** trong danh mục đang tải trên web.` : 'Kho phim đang tải dữ liệu, bạn thử lại sau vài giây nhé.');
    const matchedCategories = categories.filter(c => {
        const name = searchTV(c.name);
        return name && (` ${q} `.includes(` ${name} `) || (name === 'hoat hinh' && /\banime\b/.test(q)));
    });
    const mood = /\b(buon|stress|cang thang|met moi|thu gian|vui ve)\b/.test(q) && /xem|phim|goi y/.test(q);
    if (mood && !matchedCategories.length) {
        const comedy = categories.find(c => searchTV(c.name) === 'hai huoc');
        if (comedy) matchedCategories.push(comedy);
    }
    const namedActors = actors.filter(actor => actor.name && searchTV(actor.name).length >= 4 && q.includes(searchTV(actor.name)));
    const namedAuthors = authors.filter(author => author.name && searchTV(author.name).length >= 4 && q.includes(searchTV(author.name)));
    const namedCharacters = characters.filter(character => character.name && searchTV(character.name).length >= 4 && q.includes(searchTV(character.name)));
    const country = detectCountryInQuery(q);
    const discovery = /\b(goi y|de xuat|tim|top|danh sach|xem gi|xem phim gi|phim nao hay|phim hay|xin phim|phim de xem|phim moi|co phim|phu hop|hop goi|nhieu tap nhat|it tap nhat|xem nhieu nhat|nhieu phan nhat)\b/.test(q)
        || (matchedCategories.length && /\b(phim|anime)\b/.test(q)) || mood || continuation || partial.length || namedActors.length || namedAuthors.length || namedCharacters.length;
    if (!discovery || /\b(tai sao|vi sao|giai thich|so sanh|phan tich|ket thuc|review|danh gia)\b/.test(q)) return null;
    if (!catalogReady) return result('Kho phim đang tải dữ liệu. Bạn gửi lại câu hỏi sau vài giây để mình gợi ý đúng phim trên web nhé.');
    if (/nhieu phan nhat|nhieu season nhat/.test(q)) {
        const candidates = isPlanAppropriateQuery(prompt) ? filterMoviesByEntitlement(movies, plans, userPlanInfo) : movies;
        const franchise = getFranchiseStats(candidates)[0];
        if (franchise) return result(`Series có nhiều phần nhất trong danh mục này là **${franchise.baseName}**, gồm **${franchise.totalParts} phần**:\n${franchise.movies.slice(0, 10).map(movie => `• ${link(movie)}`).join('\n')}`);
    }
    let selected = movies.filter(movie => !excluded.has(routeSegment(movie)));
    if (partial.length) selected = selected.filter(movie => partial.includes(movie));
    if (matchedCategories.length) selected = selected.filter(movie => matchedCategories.every(category => {
        const negative = new RegExp(`(?:khong|dung|tranh|bo) (?:xem |phim )?${searchTV(category.name)}`).test(q);
        const has = (movie.listCategory || []).some(id => String(id) === String(category.id));
        return negative ? !has : has;
    }));
    if (country && !partial.length) selected = selected.filter(movie => isMovieMatchCountry(movie, country));
    if (namedActors.length) selected = selected.filter(movie => namedActors.every(actor => (movie.listActor || movie.actors || movie.actor || []).includes(actor.id)));
    if (namedAuthors.length) selected = selected.filter(movie => namedAuthors.every(author => (movie.listAuthor || []).includes(author.id) || movie.author === author.id));
    if (namedCharacters.length) selected = selected.filter(movie => namedCharacters.every(character => (movie.listCharacter || movie.characters || movie.character || []).includes(character.id)));
    const year = q.match(/\b((?:19|20)\d{2})\b/)?.[1];
    if (year) selected = selected.filter(movie => String(movie.releaseYear || movie.year) === year);
    const requestedPlan = detectPlanInQuery(q);
    if (isPlanAppropriateQuery(prompt) || (continuation && isPlanAppropriateQuery(previousUser.text))) selected = filterMoviesByEntitlement(selected, plans, userPlanInfo);
    else if (requestedPlan?.targetLevel != null) selected = selected.filter(movie => getMoviePlanInfo(movie, plans).level === requestedPlan.targetLevel);
    else if (requestedPlan?.isFree) selected = selected.filter(movie => getMoviePlanInfo(movie, plans).isFree);
    else if (requestedPlan?.isPaid) selected = selected.filter(movie => !getMoviePlanInfo(movie, plans).isFree);
    if (/phim le/.test(q)) selected = selected.filter(movie => Number(movie.endEpisode) <= 1);
    if (/phim bo/.test(q)) selected = selected.filter(movie => Number(movie.endEpisode) > 1);
    selected.sort((a, b) => /nhieu tap nhat|dai nhat/.test(q) ? (Number(b.endEpisode) || 0) - (Number(a.endEpisode) || 0)
        : /it tap nhat|ngan nhat/.test(q) ? (Number(a.endEpisode) || 0) - (Number(b.endEpisode) || 0)
            : /moi nhat|phim moi/.test(q) ? (Number(b.releaseYear || b.year) || 0) - (Number(a.releaseYear || a.year) || 0)
                : (Number(b.views) || 0) - (Number(a.views) || 0));
    const count = Math.min(10, Math.max(1, Number(q.match(/\b(?:top )?(\d+)\s*(?:phim|bo|anime)/)?.[1]) || 5));
    const chosen = selected.slice(0, count);
    if (!chosen.length) return result('Mình chưa tìm thấy phim trong danh mục hiện tại khớp đủ các yêu cầu này. Bạn thử đổi thể loại, quốc gia hoặc tên phim nhé.');
    const rows = chosen.map(movie => `• ${link(movie)} | ${episodeText(movie)} | ${getMoviePlanInfo(movie, plans).planName}`);
    return result(`${mood ? 'Bạn có thể thử những phim này để thư giãn nhé! 🍿' : 'Mình tìm được các phim này trên MFILM:'}\n${rows.join('\n')}${selected.length > count ? '\nNhắn **tiếp** để xem những phim khác.' : ''}`);
}
