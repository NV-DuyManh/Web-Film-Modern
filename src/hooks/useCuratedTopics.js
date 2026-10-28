import { useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AuthContext } from '../contexts/AuthProvider';
import { db } from '../config/firebaseConfig';
import { CURATED_TOPICS, curatedTopics } from '../utils/curatedTopics';
import { startVisiblePolling } from '../utils/visiblePolling';
import { publicRequestCache } from '../services/publicRequestCache';

// A single small control document stores visibility. The fixed definitions and
// film selection rules are shared by the client, admin and SEO renderer.
export default function useCuratedTopics(enabled = true) {
    const { isLogin } = useContext(AuthContext) || {};
    const admin = isLogin?.role === 'admin';
    const [topics, setTopics] = useState([]);
    useEffect(() => {
        if (!enabled) return;
        let active = true;
        if (admin) return onSnapshot(doc(db, 'PublicCatalogControls', 'topics'), snapshot => {
            if (active) setTopics(curatedTopics(snapshot.data()?.enabled));
        }, error => console.warn('Topic controls unavailable:', error.code));
        const refresh = async () => {
            try {
                const data = await publicRequestCache.read('/api/topics', { maxAgeMs: 30000, timeoutMs: 6000,
                    accept: value => Array.isArray(value?.items) && CURATED_TOPICS.every(topic => value.items.some(item => item.id === topic.id && typeof item.enabled === 'boolean')) });
                if (active && Array.isArray(data.items) && CURATED_TOPICS.every(topic => data.items.some(item => item.id === topic.id && typeof item.enabled === 'boolean'))) setTopics(curatedTopics(Object.fromEntries(data.items.map(item => [item.id, item.enabled]))));
            } catch { /* Keep the last confirmed state during network interruptions. */ }
        };
        const stop = startVisiblePolling(refresh, { intervalMs: 30000 });
        return () => { active = false; stop(); };
    }, [admin, enabled]);
    return topics;
}

export async function setCuratedTopicEnabled(id, enabled) {
    if (!curatedTopics().some(topic => topic.id === id) || typeof enabled !== 'boolean') throw new Error('Invalid topic visibility');
    await setDoc(doc(db, 'PublicCatalogControls', 'topics'), { enabled: { [id]: enabled } }, { merge: true });
}
