import MALE_AVATAR from '../assets/Male.png';
import FEMALE_AVATAR from '../assets/Female.png';
import { getObjectById } from '../services/firebaseResponse';

export const getAgeRatingColorClass = (rating) => {
    switch (rating) {
        case 'P': 
            return "bg-linear-to-r from-emerald-500 to-green-600 text-white";
        case 'K': 
            return "bg-linear-to-r from-orange-500 to-red-500 text-white";
        case 'T13': 
            return "bg-linear-to-r from-yellow-400 to-amber-500 text-black";
        case 'T16': 
            return "bg-linear-to-r from-orange-500 to-red-500 text-white";
        case 'T18': 
            return "bg-linear-to-r from-red-600 to-rose-700 text-white";
        default: 
            return "bg-linear-to-r from-blue-500 to-blue-600 text-white";
    }
};

export const getDefaultAvatar = (sexID) => {
    return sexID === 'Female' ? FEMALE_AVATAR : MALE_AVATAR;
};

export const getExpiryDate = (p) => {
    if (!p || !p.expiryDate) return new Date(0);
    if (typeof p.expiryDate.toDate === 'function') return p.expiryDate.toDate();
    if (p.expiryDate.seconds) return new Date(p.expiryDate.seconds * 1000);
    return new Date(p.expiryDate);
};

export const getUserPlanInfo = (user, subscriptions, plans) => {
    if (!user) return { name: 'FREE', level: 0, theme: 'blue' };
    if (user.role === 'admin') return { name: 'ADMIN', level: 999, theme: 'admin' };

    let highestPlan = null;
    
    if (user.planID) {
        highestPlan = getObjectById(plans, user.planID);
    }

    if (!highestPlan) {
        const userSubs = subscriptions.filter(p => p.userID === user.id && getExpiryDate(p) > new Date());
        if (userSubs.length === 0) return { name: 'FREE', level: 0, theme: 'blue' };

        const highestSub = userSubs.reduce((max, item) => {
            const currentPlan = getObjectById(plans, item.planID);
            const maxPlan = getObjectById(plans, max.planID);
            return (currentPlan?.level || 0) > (maxPlan?.level || 0) ? item : max;
        }, userSubs[0]);

        highestPlan = getObjectById(plans, highestSub.planID);
    }

    if (!highestPlan) return { name: 'VIP', level: 1, theme: 'cyan' };

    const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
    const index = sortedPlans.findIndex(p => p.id === highestPlan.id);
    const themeNames = ['blue', 'cyan', 'yellow', 'rose', 'purple', 'emerald'];
    const theme = themeNames[index] || 'blue';

    return { name: highestPlan.name, level: highestPlan.level, theme: theme };
};

export const getThemeBadgeStyle = (theme) => {
    switch (theme) {
        case 'admin': return 'text-white bg-linear-to-r from-purple-600 via-fuchsia-500 to-purple-600 badge-shine shadow-[0_0_20px_rgba(168,85,247,0.8)] border border-purple-400 font-black tracking-widest';
        case 'slate': return 'text-slate-300 bg-slate-700/50 border border-slate-500/50 shadow-none';
        case 'red': return 'text-white bg-linear-to-r from-red-600 via-rose-500 to-red-600 badge-shine shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-red-400';
        case 'blue': return 'text-white bg-linear-to-r from-blue-500 via-indigo-400 to-blue-500 badge-shine shadow-[0_0_15px_rgba(59,130,246,0.6)] border border-blue-400';
        case 'cyan': return 'text-white bg-linear-to-r from-cyan-400 via-blue-400 to-cyan-400 badge-shine shadow-[0_0_15px_rgba(34,211,238,0.6)] border border-cyan-400';
        case 'yellow': return 'text-yellow-900 bg-linear-to-r from-yellow-300 via-amber-200 to-yellow-300 badge-shine shadow-[0_0_20px_rgba(250,204,21,0.8)] border border-yellow-300';
        case 'rose': return 'text-white bg-linear-to-r from-rose-500 via-pink-400 to-rose-500 badge-shine shadow-[0_0_15px_rgba(251,113,133,0.6)] border border-rose-400';
        default: return 'text-yellow-900 bg-linear-to-r from-yellow-300 to-amber-500';
    }
};

export const getThemeColorStyle = (theme) => {
    switch (theme) {
        case 'admin': return 'border-purple-500 text-purple-400 bg-purple-500/20';
        case 'slate': return 'border-slate-500 text-slate-400 bg-slate-500/10';
        case 'red': return 'border-red-500 text-red-400 bg-red-500/10';
        case 'blue': return 'border-blue-500 text-blue-400 bg-blue-500/10';
        case 'cyan': return 'border-cyan-500 text-cyan-400 bg-cyan-500/10';
        case 'yellow': return 'border-yellow-500 text-yellow-400 bg-yellow-500/10';
        case 'rose': return 'border-rose-500 text-rose-400 bg-rose-500/10';
        default: return 'border-slate-500 text-slate-400 bg-slate-500/10';
    }
};

export const getThemeNameByIndex = (index) => {
    const themeNames = ['blue', 'cyan', 'yellow', 'rose'];
    return themeNames[index] || themeNames[themeNames.length - 1];
};

export const slugify = (str) => {
    if (!str) return '';
    str = str.toLowerCase();
    // Thay thế chữ đ/Đ trước khi normalize
    str = str.replace(/đ/g, "d");
    // Loại bỏ dấu tiếng Việt
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Bỏ các ký tự đặc biệt
    str = str.replace(/[^a-z0-9\s-]/g, '');
    // Thay khoảng trắng bằng dấu gạch ngang
    str = str.replace(/\s+/g, '-');
    // Bỏ nhiều dấu gạch ngang liên tiếp
    str = str.replace(/-+/g, '-');
    // Cắt bỏ dấu gạch ngang ở đầu và cuối
    str = str.replace(/^-+|-+$/g, '');
    
    return str;
};

const cache = {};

export function subscribeToCollection(key, collectionName, callback, fetchFn, processData) {
    if (!cache[key]) {
        cache[key] = { data: null, listeners: new Set(), unsubscribe: null };
        cache[key].unsubscribe = fetchFn(collectionName, (rawData) => {
            const processed = processData ? processData(rawData) : rawData;
            cache[key].data = processed;
            cache[key].listeners.forEach(cb => cb(processed));
        });
    }
    cache[key].listeners.add(callback);
    if (cache[key].data !== null) callback(cache[key].data);
    return () => {
        if (!cache[key]) return;
        cache[key].listeners.delete(callback);
        if (cache[key].listeners.size === 0) {
            cache[key].unsubscribe?.();
            delete cache[key];
        }
    };
}

export function getCachedData(key) {
    return cache[key]?.data ?? null;
}

export function invalidateCache(key) {
    if (cache[key]) {
        cache[key].unsubscribe?.();
        delete cache[key];
    }
}
