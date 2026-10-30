import { getPlanAppearance } from './planAppearance.js';

export function membershipTime(value) {
    if (value == null || value === '') return NaN;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (typeof value._seconds === 'number') return value._seconds * 1000;
    return new Date(value).getTime();
}

export function activeSubscription(subscription, at = Date.now()) {
    const status = String(subscription.status || '').trim().toLowerCase();
    if (status && !['success', 'active', 'completed', 'paid'].includes(status)) return false;
    const start = membershipTime(subscription.startDate);
    return (!Number.isFinite(start) || start <= at) && membershipTime(subscription.expiryDate) > at;
}

const free = () => ({ name: 'FREE', level: 0, theme: getPlanAppearance().theme });
export function resolveMembership(user, subscriptions = [], plans = [], at = Date.now()) {
    if (!user) return free();
    if (user.role === 'admin') return { name: 'ADMIN', level: 999, theme: 'admin' };
    const byID = new Map(plans.map(plan => [plan.id, plan]));
    const candidates = [byID.get(user.planID), ...subscriptions
        .filter(subscription => subscription.userID === user.id && activeSubscription(subscription, at))
        .map(subscription => byID.get(subscription.planID))].filter(Boolean);
    const highest = candidates.sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0))[0];
    return highest ? { id: highest.id, name: highest.name, level: Number(highest.level) || 0, theme: getPlanAppearance(highest).theme } : free();
}

// Display-only projection. Never use this public field to authorize playback.
export function resolveCommentMember(comment, profile, at = Date.now()) {
    const user = { ...comment.author, ...profile, id: comment.userID };
    if (profile?.membership) {
        const membership = profile.membership;
        const until = membership.nextChangeAt;
        return { user, plan: until && until <= at ? null : membership.plan };
    }
    // Snapshots retain names/avatars but their historical tier is not today's
    // membership. Unknown/loading must never flash a misleading Free badge.
    return { user, plan: null };
}
