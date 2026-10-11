import { useEffect, useMemo, useState } from 'react';
import { db } from '../config/firebaseConfig';
import { createUserPresenceService } from '../services/userPresence';
import { onlineUserIds } from '../utils/userPresence';

const presence = createUserPresenceService(db);

export default function useUserPresence() {
    const [state, setState] = useState({ rows: [], status: 'loading' });
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const unsubscribe = presence.subscribe((rows, confirmed) => {
            setNow(Date.now());
            setState({ rows, status: confirmed ? 'ready' : 'connecting' });
        }, () => setState({ rows: [], status: 'error' }));
        const timer = setInterval(() => setNow(Date.now()), 10_000);
        return () => { unsubscribe(); clearInterval(timer); };
    }, []);
    const onlineIds = useMemo(() => state.status === 'ready' ? onlineUserIds(state.rows, now) : new Set(), [state, now]);
    return { onlineIds, status: state.status };
}
