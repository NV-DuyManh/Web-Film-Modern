export const PRESENCE_HEARTBEAT_MS = 60_000;
export const PRESENCE_TTL_MS = 120_000;

export function presenceMillis(value) {
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (Number.isFinite(value?.seconds)) return value.seconds * 1000;
    return typeof value === 'number' && Number.isFinite(value) ? value : NaN;
}

export function isPresenceSessionOnline(session, now = Date.now()) {
    const confirmed = presenceMillis(session?.lastSeen);
    const sent = presenceMillis(session?.seenAt);
    // A delayed offline write must not revive a tab that closed earlier.
    return Number.isFinite(confirmed) && Number.isFinite(sent)
        && confirmed <= now + PRESENCE_TTL_MS && sent <= now + PRESENCE_TTL_MS
        && now < Math.min(confirmed, sent) + PRESENCE_TTL_MS;
}

export function onlineUserIds(records, now = Date.now()) {
    return new Set(records.filter(row => Object.values(row.sessions || {}).some(session => isPresenceSessionOnline(session, now))).map(row => row.userID || row.id));
}
