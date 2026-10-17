const AUTH_THEME_KEY = 'mfilm-auth-theme';
let lastNight = true;

export function readAuthNight() {
    try {
        const saved = localStorage.getItem(AUTH_THEME_KEY);
        if (saved === 'day' || saved === 'night') lastNight = saved === 'night';
    } catch { /* Keep the session choice when browser storage is unavailable. */ }
    return lastNight;
}

export function saveAuthNight(night) {
    lastNight = night;
    try { localStorage.setItem(AUTH_THEME_KEY, night ? 'night' : 'day'); }
    catch { /* Theme switching still works when browser storage is blocked. */ }
}
