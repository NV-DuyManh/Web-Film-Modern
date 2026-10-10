import { accountServices } from '../accounts/firebase.js';
import { curatedTopics, topicEnabledOverrides } from '../../src/utils/curatedTopics.js';

async function readControls() {
    const { db } = accountServices();
    let unsubscribe, timer;
    try {
        // Read one server snapshot and immediately close the listener. Visitors
        // share the CDN result instead of subscribing to Firestore themselves.
        const snapshot = await new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error('Topic controls timed out')), 2500);
            unsubscribe = db.doc('PublicCatalogControls/topics').onSnapshot(resolve, reject);
        });
        return topicEnabledOverrides(snapshot.data()?.enabled);
    } finally { clearTimeout(timer); unsubscribe?.(); }
}

export function createTopicControlsLoader({ read = readControls, now = Date.now } = {}) {
    let cached, nextCheck = 0, loading;
    return async () => {
        if (!cached || now() >= nextCheck) {
            loading ||= read().then(enabled => { cached = curatedTopics(enabled); nextCheck = now() + 30000; })
                .catch(error => {
                    console.warn('Topic controls unavailable:', error.message);
                    cached ||= curatedTopics();
                    nextCheck = now() + 300000;
                }).finally(() => { loading = null; });
            await loading;
        }
        return cached;
    };
}
export const loadTopicControls = createTopicControlsLoader();
