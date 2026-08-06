import { getObjectById } from '../services/firebaseResponse';

export const getExpiryDate = (p) => {
    if (!p || !p.expiryDate) return new Date(0);
    if (typeof p.expiryDate.toDate === 'function') return p.expiryDate.toDate();
    if (p.expiryDate.seconds) return new Date(p.expiryDate.seconds * 1000);
    return new Date(p.expiryDate);
};

export const getUserPlanInfo = (user, subscriptions, plans) => {
    if (!user) return { name: 'FREE', level: 0, theme: 'blue' };
    if (user.role === 'Admin') return { name: 'ADMIN', level: 999, theme: 'red' };

    const userSubs = subscriptions.filter(p => p.userID === user.id && getExpiryDate(p) > new Date());
    if (userSubs.length === 0) return { name: 'FREE', level: 0, theme: 'blue' };

    const highestSub = userSubs.reduce((max, item) => {
        const currentPlan = getObjectById(plans, item.planID);
        const maxPlan = getObjectById(plans, max.planID);
        return (currentPlan?.level || 0) > (maxPlan?.level || 0) ? item : max;
    }, userSubs[0]);

    const highestPlan = getObjectById(plans, highestSub.planID);
    if (!highestPlan) return { name: 'VIP', level: 1, theme: 'cyan' };

    const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
    const index = sortedPlans.findIndex(p => p.id === highestPlan.id);
    const themeNames = ['blue', 'cyan', 'yellow', 'rose', 'purple', 'emerald'];
    const theme = themeNames[index] || 'blue';

    return { name: highestPlan.name, level: highestPlan.level, theme: theme };
};

export const getThemeBadgeStyle = (theme) => {
    switch (theme) {
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
