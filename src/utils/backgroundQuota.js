export const BACKGROUND_READ_LIMIT = 20000;
export const BACKGROUND_WRITE_LIMIT = 6000;

// Firestore's free daily quota resets at midnight in Pacific time, including DST.
export function quotaDay(now = Date.now()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function nextQuotaReset(now = Date.now()) {
    const today = quotaDay(now);
    let time = Math.ceil((now + 1) / 3600000) * 3600000;
    while (quotaDay(time) === today) time += 3600000;
    return time;
}

export class BackgroundQuotaError extends Error {
    constructor(now) {
        super('Background daily budget reached. Progress is saved until the next quota day.');
        this.name = 'BackgroundQuotaError';
        this.code = 'background-quota';
        this.resumeAt = nextQuotaReset(now);
    }
}

export function createQuotaCounter(state = {}, { now = Date.now, readLimit = BACKGROUND_READ_LIMIT, writeLimit = BACKGROUND_WRITE_LIMIT } = {}) {
    let current = state.day === quotaDay(now()) ? { day: state.day, reads: Number(state.reads) || 0, writes: Number(state.writes) || 0 } : { day: quotaDay(now()), reads: 0, writes: 0 };
    const refresh = () => { if (current.day !== quotaDay(now())) current = { day: quotaDay(now()), reads: 0, writes: 0 }; };
    return {
        charge(reads = 0, writes = 0) {
            refresh();
            if (current.reads + reads > readLimit || current.writes + writes > writeLimit) throw new BackgroundQuotaError(now());
            current.reads += reads; current.writes += writes;
        },
        refund(reads = 0) { refresh(); current.reads = Math.max(0, current.reads - reads); },
        snapshot() { refresh(); return { ...current, readLimit, writeLimit }; },
    };
}
