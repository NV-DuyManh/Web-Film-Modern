import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { ACTIVITY_COOLDOWN_MS, vietnamDay } from '../../src/utils/dailyMovieRanking.js';

export const DAILY_SHARDS = 8;
const hash = value => createHash('sha256').update(value).digest('hex');

export function createDailyActivityStore(db) {
    // Nested collections stay server-only under the existing Firestore rules.
    const root = db.collection('MovieActivity').doc('private');
    return {
        async record(visitorId, ip, events, at) {
            const visitor = hash(`${visitorId}:${ip}`);
            const shard = String(parseInt(visitor.slice(0, 8), 16) % DAILY_SHARDS);
            const receipt = root.collection('Visitors').doc(visitor);
            return db.runTransaction(async tx => {
                const previous = (await tx.get(receipt)).data() || {};
                const day = vietnamDay(at);
                const entries = Object.fromEntries(Object.entries(previous.entries || {}).filter(([, value]) => at - value < ACTIVITY_COOLDOWN_MS));
                let total = previous.day === day ? previous.total || 0 : 0;
                let accepted = 0;
                const days = new Map();
                for (const event of events) {
                    const key = `${event.day}:${event.movieId}:${event.kind}`;
                    if (total >= 300 || (entries[key] && at - entries[key] < ACTIVITY_COOLDOWN_MS)) continue;
                    const movies = days.get(event.day) || {};
                    movies[event.movieId] ||= {};
                    movies[event.movieId][event.kind] = FieldValue.increment(1);
                    days.set(event.day, movies);
                    entries[key] = at; total++; accepted++;
                }
                if (accepted) {
                    tx.set(receipt, { day, entries, total, updatedAt: at });
                    for (const [date, movies] of days) tx.set(root.collection('Days').doc(date).collection('Shards').doc(shard), { movies, updatedAt: at }, { merge: true });
                }
                return accepted;
            }, { maxAttempts: 2 });
        },
        async read(day) {
            let unsubscribe, timer;
            try {
                const snapshot = await new Promise((resolve, reject) => {
                    timer = setTimeout(() => reject(new Error('Daily ranking unavailable')), 3500);
                    unsubscribe = root.collection('Days').doc(day).collection('Shards').onSnapshot(resolve, reject);
                });
                return snapshot.docs.map(doc => doc.data());
            } finally { clearTimeout(timer); unsubscribe?.(); }
        },
    };
}
