import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../contexts/UserProvider';
import { accountRequest } from '../services/accountService';
import { resolveAccountAvatar } from '../utils/accountAvatar';
import { SectionVisibilityContext } from '../contexts/SectionVisibilityContext';
import { createPublicMemberCache } from '../services/publicMemberProfiles';
import { startVisiblePolling } from '../utils/visiblePolling';

const cache = createPublicMemberCache({ request: ids => accountRequest('public-profiles', { ids }, false) });
export default function usePublicUsers(ids) {
    const legacy = useContext(UserContext) || [];
    const nearby = useContext(SectionVisibilityContext);
    const key = [...new Set(ids.filter(Boolean))].sort().join(',');
    const [state, setState] = useState({ key: '', data: [] });
    useEffect(() => {
        if (!nearby || !key) return;
        let active = true;
        const load = async () => {
            try {
                const profiles = await cache.load(key.split(','));
                if (active) setState({ key, data: profiles.map(resolveAccountAvatar) });
            } catch { /* Keep confirmed profiles during temporary failures; never invent Free. */ }
        };
        const stop = startVisiblePolling(load);
        const changed = () => { cache.clear(); void load(); };
        window.addEventListener('mfilm_account_changed', changed);
        return () => { active = false; stop(); window.removeEventListener('mfilm_account_changed', changed); };
    }, [key, nearby]);
    const publicProfiles = state.key === key ? state.data : [];
    return key.split(',').filter(Boolean).map(id => {
        const profile = publicProfiles.find(user => user.id === id);
        const fallback = legacy.find(user => user.id === id);
        return profile || (fallback ? { id, name: fallback.name, fullName: fallback.fullName, avatarUrl: fallback.avatarUrl, sexID: fallback.sexID, selectedFrame: fallback.selectedFrame } : null);
    }).filter(Boolean);
}
