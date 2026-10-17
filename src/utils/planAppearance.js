// Shared by movie labels, account badges and plan selectors. Color follows the
// tier itself, so filtering or reordering a plan list cannot change its color.
const appearances = {
    free: {
        theme: 'blue', color: '#94a3b8', textColor: 'text-slate-300', borderColor: 'border-slate-400',
        glowColor: 'bg-slate-400/10', dotBg: 'bg-slate-400', badgeBg: 'bg-slate-500',
        className: 'bg-slate-600 border-slate-500 text-white',
    },
    basic: {
        theme: 'cyan', color: '#22d3ee', textColor: 'text-cyan-400', borderColor: 'border-cyan-400',
        glowColor: 'bg-cyan-400/10', dotBg: 'bg-cyan-400', badgeBg: 'bg-cyan-500',
        className: 'bg-linear-to-r from-blue-600 to-cyan-500 border-cyan-300 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]',
    },
    plus: {
        theme: 'yellow', color: '#facc15', textColor: 'text-yellow-400', borderColor: 'border-yellow-400',
        glowColor: 'bg-yellow-400/10', dotBg: 'bg-yellow-400', badgeBg: 'bg-yellow-500',
        className: 'bg-linear-to-r from-yellow-400 via-amber-500 to-yellow-500 border-yellow-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.7)]',
    },
    premium: {
        theme: 'rose', color: '#f472b6', textColor: 'text-pink-400', borderColor: 'border-pink-400',
        glowColor: 'bg-pink-400/10', dotBg: 'bg-pink-400', badgeBg: 'bg-pink-500',
        className: 'bg-linear-to-r from-fuchsia-600 via-pink-400 to-rose-500 border-pink-300 text-white shadow-[0_0_15px_rgba(236,72,153,0.8)] premium-laser',
    },
    admin: {
        theme: 'admin', color: '#c084fc', textColor: 'text-purple-400', borderColor: 'border-purple-400',
        glowColor: 'bg-purple-400/10', dotBg: 'bg-purple-400', badgeBg: 'bg-purple-500',
        className: 'bg-linear-to-r from-purple-600 via-fuchsia-500 to-purple-600 border-purple-400 text-white',
    },
};

export function getPlanAppearance(plan) {
    const name = String(plan?.planName || plan?.name || '').trim().toLowerCase();
    if (name === 'admin') return appearances.admin;
    const level = Number(plan?.level);
    if (Number.isFinite(level) && plan?.level != null && plan.level !== '') {
        if (level >= 3) return appearances.premium;
        if (level === 2) return appearances.plus;
        if (level === 1) return appearances.basic;
        return appearances.free;
    }
    return appearances[name === 'prenium' ? 'premium' : name] || appearances.free;
}

// Old Free selections used "slate"; keep their blue frame without rewriting profiles.
export function getAvatarFrameTheme(user, plan) {
    const selected = user?.selectedFrame;
    if (selected === 'slate') return 'blue';
    if (['cyberpunk', 'cyber_radar', 'cyber_pulse'].includes(selected)) return 'cyan';
    if (['blue', 'cyan', 'yellow', 'red', 'rose', 'admin'].includes(selected)) return selected;
    return getPlanAppearance(user?.role === 'admin' ? { name: 'admin' } : plan).theme;
}
