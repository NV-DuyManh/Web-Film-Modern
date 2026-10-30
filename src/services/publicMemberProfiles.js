export function createPublicMemberCache({ request, now = Date.now } = {}) {
    const cache = new Map(), pending = new Map();
    return {
        async load(ids) {
            const selected = [...new Set(ids)].sort();
            const missing = selected.filter(id => !cache.has(id) || cache.get(id).until <= now());
            for (let i = 0; i < missing.length; i += 30) {
                const batch = missing.slice(i, i + 30), key = batch.join(',');
                if (!pending.has(key)) pending.set(key, request(batch).then(users => {
                    if (!Array.isArray(users)) throw new Error('Invalid public profiles');
                    const byID = new Map(users.map(user => [user.id, user]));
                    for (const id of batch) {
                        const profile = byID.get(id);
                        const checkedAt = Number(profile?.membership?.checkedAt);
                        const until = Math.min(now() + 60000, Number.isFinite(checkedAt) ? checkedAt + 60000 : Infinity, profile?.membership?.nextChangeAt || Infinity);
                        cache.set(id, { profile, until });
                    }
                }).finally(() => { pending.delete(key); }));
                await pending.get(key);
            }
            return selected.map(id => cache.get(id)?.profile).filter(Boolean);
        },
        clear() { cache.clear(); },
    };
}
