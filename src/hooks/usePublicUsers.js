import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../contexts/UserProvider';
import { SECURE_ACCOUNTS_ENABLED, accountRequest } from '../services/accountService';
import { resolveAccountAvatar } from '../utils/accountAvatar';

const cache = new Map();
export default function usePublicUsers(ids) {
    const legacy = useContext(UserContext) || [];
    const key = [...new Set(ids.filter(Boolean))].sort().join(',');
    const [state, setState] = useState({ key: '', data: [] });
    useEffect(() => {
        if (!SECURE_ACCOUNTS_ENABLED) return;
        let active = true;
        const all = key ? key.split(',') : [];
        const missing = all.filter(id => !cache.has(id) || cache.get(id).expiresAt < Date.now());
        const load = async () => {
            for (let i = 0; i < missing.length; i += 30) {
                const users = await accountRequest('public-profiles', { ids: missing.slice(i, i + 30) }, false);
                if (!active) return;
                for (const user of users) cache.set(user.id, { profile: resolveAccountAvatar(user), expiresAt: Date.now() + 300_000 });
            }
            if (active) setState({ key, data: all.map(id => cache.get(id)?.profile).filter(Boolean) });
        };
        load().catch(() => { if (active) setState({ key, data: [] }); });
        return () => { active = false; };
    }, [key]);
    return SECURE_ACCOUNTS_ENABLED ? (state.key === key ? state.data : []) : legacy;
}
