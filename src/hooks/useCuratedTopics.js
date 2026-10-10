import { useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AuthContext } from '../contexts/AuthProvider';
import { db } from '../config/firebaseConfig';
import { CURATED_TOPICS, curatedTopics } from '../utils/curatedTopics';

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
                const response = await fetch('/api/topics', { signal: AbortSignal.timeout(6000) });
                if (!response.ok) throw new Error('Topic controls unavailable');
                const data = await response.json();
                if (active && Array.isArray(data.items) && CURATED_TOPICS.every(topic => data.items.some(item => item.id === topic.id && typeof item.enabled === 'boolean'))) setTopics(curatedTopics(Object.fromEntries(data.items.map(item => [item.id, item.enabled]))));
            } catch { /* Keep the last confirmed state during network interruptions. */ }
        };
        refresh();
        const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30000);
        const onVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
        document.addEventListener('visibilitychange', onVisibility);
        return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); };
    }, [admin, enabled]);
    return topics;
}

export async function setCuratedTopicEnabled(id, enabled) {
    if (!curatedTopics().some(topic => topic.id === id) || typeof enabled !== 'boolean') throw new Error('Invalid topic visibility');
    await setDoc(doc(db, 'PublicCatalogControls', 'topics'), { enabled: { [id]: enabled } }, { merge: true });
}
