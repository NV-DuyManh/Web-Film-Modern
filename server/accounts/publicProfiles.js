import { FieldPath } from 'firebase-admin/firestore';
import { membershipTime, resolveMembership } from '../../src/utils/membership.js';

const PUBLIC_FIELDS = ['name', 'avatarUrl', 'sexID', 'role', 'planID', 'selectedFrame'];
async function readSnapshot(query, timeoutMs = 3500) {
    let unsubscribe, timer;
    try {
        const snapshot = await new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error('Public member lookup timed out')), timeoutMs);
            unsubscribe = query.onSnapshot(resolve, reject);
        });
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } finally { clearTimeout(timer); unsubscribe?.(); }
}

export function createPublicProfileReader({ db, now = Date.now, read = readSnapshot } = {}) {
    const cache = new Map(), pending = new Map();
    let planCache, planPending;
    const plans = () => {
        if (planCache && now() - planCache.at < 60000) return Promise.resolve(planCache.items);
        return planPending ||= read(db.collection('Plans').select('name', 'level').limit(50)).then(items => {
            planCache = { at: now(), items }; return items;
        }).finally(() => { planPending = null; });
    };
    return async ids => {
        if (!Array.isArray(ids) || ids.length > 30 || ids.some(id => typeof id !== 'string' || !/^[\w-]{1,128}$/.test(id))) throw Object.assign(new Error('At most 30 profile IDs allowed'), { status: 400 });
        const selected = [...new Set(ids)].sort();
        if (!selected.length) return [];
        const at = now();
        const missing = selected.filter(id => !cache.has(id) || cache.get(id).until <= at);
        if (missing.length) {
            const key = missing.join(',');
            if (!pending.has(key)) pending.set(key, (async () => {
                const [users, subscriptions, availablePlans] = await Promise.all([
                    read(db.collection('Users').where(FieldPath.documentId(), 'in', missing).select(...PUBLIC_FIELDS)),
                    read(db.collection('Subscriptions').where('userID', 'in', missing).select('userID', 'planID', 'status', 'startDate', 'expiryDate').limit(1000)),
                    plans(),
                ]);
                if (subscriptions.length >= 1000 || !availablePlans.length) throw new Error('Incomplete public membership data');
                const checkedAt = now();
                const byID = new Map(users.map(user => [user.id, user]));
                for (const id of missing) {
                    const user = byID.get(id);
                    if (!user) { cache.set(id, { until: checkedAt + 60000, profile: null }); continue; }
                    const boundaries = subscriptions.filter(item => item.userID === id).flatMap(item => [membershipTime(item.startDate), membershipTime(item.expiryDate)]).filter(time => time > checkedAt);
                    const nextChangeAt = boundaries.length ? Math.min(...boundaries) : null;
                    const profile = Object.fromEntries(['id', ...PUBLIC_FIELDS].filter(field => user[field] !== undefined).map(field => [field, user[field]]));
                    profile.membership = { plan: resolveMembership(user, subscriptions, availablePlans, checkedAt), checkedAt, nextChangeAt };
                    cache.set(id, { until: Math.min(checkedAt + 60000, nextChangeAt || Infinity), profile });
                }
                if (cache.size > 1000) for (const [id, item] of cache) { if (item.until <= checkedAt) cache.delete(id); }
                while (cache.size > 1000) cache.delete(cache.keys().next().value);
            })().finally(() => { pending.delete(key); }));
            await pending.get(key);
        }
        return selected.map(id => cache.get(id)?.profile).filter(Boolean);
    };
}
