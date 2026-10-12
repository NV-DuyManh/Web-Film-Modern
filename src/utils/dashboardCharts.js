import { getPlanAppearance } from './planAppearance.js';

export const CHART_COLORS = ['#22d3ee', '#f472b6', '#facc15', '#a78bfa', '#34d399', '#fb923c'];
const normalize = value => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const countries = {
    'nhat ban': 'Japan', japan: 'Japan', 'trung quoc': 'China', china: 'China', 'au my': 'Western',
    'hong kong': 'Hong Kong', 'han quoc': 'South Korea', korea: 'South Korea', 'south korea': 'South Korea',
    'thai lan': 'Thailand', thailand: 'Thailand', phap: 'France', anh: 'UK', canada: 'Canada',
    'viet nam': 'Vietnam', vietnam: 'Vietnam', 'tay ban nha': 'Spain', 'tho nhi ky': 'Turkey', my: 'USA',
    usa: 'USA', 'nam phi': 'South Africa', malaysia: 'Malaysia', 'dai loan': 'Taiwan',
    'an do': 'India', indonesia: 'Indonesia', philippines: 'Philippines', duc: 'Germany',
    y: 'Italy', uc: 'Australia', nga: 'Russia', brazil: 'Brazil', 'a rap xe ut': 'Saudi Arabia',
};
const genres = {
    'cam dong': 'Emotional', 'tu tien': 'Cultivation', 'hoc duong': 'School', 'tam ly': 'Psychological',
    'hinh su': 'Crime', 'huyen bi': 'Mystery', 'hanh dong': 'Action', 'phan dien': 'Villains',
    'khoa hoc': 'Science', 'vien tuong': 'Sci-Fi', 'kh-vt': 'Sci-Fi', 'giat gan': 'Thriller',
    'lich su': 'History', 'gia dinh': 'Family', 'co trang': 'Historical', 'kich tinh': 'Drama',
    'tra thu': 'Revenge', 'tai lieu': 'Documentary', 'bi an': 'Mystery', 'hoat hinh': 'Animation',
    'kinh di': 'Horror', 'trinh tham': 'Detective', 'mien tay': 'Western', 'doi thuong': 'Slice of life',
    'lang man': 'Romance', 'hai huoc': 'Comedy', 'kinh dien': 'Classics', 'phieu luu': 'Adventure',
    'chinh kich': 'Drama', 'gia tuong': 'Fantasy', 'xuyen khong': 'Isekai',
    'chuyen sinh': 'Reincarnation', 'tre em': 'Kids', 'sinh ton': 'Survival', 'bao luc': 'Violence',
    'than thoai': 'Mythology', 'tinh cam': 'Romance', 'chien tranh': 'War', 'am nhac': 'Music',
    'ky ao': 'Fantasy', 'vo thuat': 'Martial arts', 'phim ngan': 'Shorts', drama: 'Drama', ecchi: 'Ecchi', soap: 'Soap',
};

export function movieFormatMix(movies = [], types = []) {
    const labels = { 'phim le': 'Films', film: 'Films', movie: 'Films', 'phim bo': 'Series', series: 'Series', 'hoat hinh': 'Animation', animation: 'Animation', anime: 'Animation', 'tv shows': 'TV Shows' };
    const names = new Map(types.map(type => [type.id, labels[normalize(type.name)] || 'Other']));
    const counts = new Map();
    for (const movie of movies) {
        const name = names.get(movie.categoryTypeID) || 'Other';
        counts.set(name, (counts.get(name) || 0) + 1);
    }
    return ['Films', 'Series', 'Animation', 'TV Shows', 'Other'].filter(name => counts.has(name)).map(name => ({ name, value: counts.get(name) }));
}

function planGroup(info) {
    const raw = String(info?.name || 'Free').trim();
    const name = raw.toLowerCase() === 'prenium' ? 'Premium' : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    return { name, color: getPlanAppearance(info).color };
}
function groupedPlans(items, resolvePlan) {
    const groups = new Map();
    for (const item of items) {
        const plan = planGroup(resolvePlan(item));
        if (!groups.has(plan.name)) groups.set(plan.name, { ...plan, value: 0 });
        groups.get(plan.name).value++;
    }
    const order = ['Free', 'Basic', 'Plus', 'Premium'];
    return [...groups.values()].sort((a, b) => (order.indexOf(a.name) < 0 ? 4 : order.indexOf(a.name)) - (order.indexOf(b.name) < 0 ? 4 : order.indexOf(b.name)));
}
export function membershipMix(users = [], resolvePlan) {
    return groupedPlans(users.filter(user => user.role !== 'admin'), resolvePlan);
}
export function libraryPlans(movies = [], plans = []) {
    return groupedPlans(movies, movie => !movie.planID ? { name: 'Free' } : plans.find(plan => plan.id === movie.planID) || { name: 'Unknown' });
}
export function movieOrigins(movies = []) {
    const counts = new Map();
    for (const movie of movies) {
        const raw = Array.isArray(movie.countriesID) ? movie.countriesID[0] : String(movie.countriesID || '').split(/[,;]/)[0];
        const name = countries[normalize(raw)] || (/^[A-Za-z .-]+$/.test(raw || '') ? raw : 'Other');
        counts.set(name || 'Other', (counts.get(name || 'Other') || 0) + 1);
    }
    const ordered = [...counts].sort((a, b) => b[1] - a[1]);
    const top = ordered.filter(([name]) => name !== 'Other').slice(0, 5);
    const names = new Set(top.map(([name]) => name));
    const remainder = ordered.filter(([name]) => !names.has(name)).reduce((sum, [, count]) => sum + count, 0);
    if (remainder) top.push(['Other', remainder]);
    return top.map(([name, value], index) => ({ name, value, color: CHART_COLORS[index] }));
}
export function genreMix(movies = [], categories = [], types = []) {
    const counts = new Map();
    const names = new Map(categories.map(category => [category.id, genres[normalize(category.name)] || (/^[A-Za-z &-]+$/.test(category.name) ? category.name : 'Other')]));
    const typeNames = new Map(types.map(type => [type.id, normalize(type.name)]));
    for (const movie of movies) {
        const type = typeNames.get(movie.categoryTypeID);
        const key = ['phim le', 'film', 'movie'].includes(type) ? 'films' : ['phim bo', 'series'].includes(type) ? 'series' : null;
        if (!key) continue;
        const name = names.get(movie.listCategory?.[0]) || 'Uncategorized';
        if (!counts.has(name)) counts.set(name, { name, films: 0, series: 0 });
        counts.get(name)[key]++;
    }
    return [...counts.values()].sort((a, b) => b.films + b.series - a.films - a.series).slice(0, 6);
}

export function polarSector(index, count, value, maximum, radius = 104, center = 140) {
    const r = radius * Math.sqrt(value / Math.max(maximum, 1));
    const start = index * 2 * Math.PI / count, end = (index + 1) * 2 * Math.PI / count;
    const point = angle => [center + Math.sin(angle) * r, center - Math.cos(angle) * r];
    if (count === 1) return `M ${center} ${center-r} A ${r} ${r} 0 1 1 ${center} ${center+r} A ${r} ${r} 0 1 1 ${center} ${center-r} Z`;
    const [x1, y1] = point(start), [x2, y2] = point(end);
    return `M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${end-start>Math.PI?1:0} 1 ${x2} ${y2} Z`;
}
