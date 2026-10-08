import { useEffect, useState } from 'react';
import useAdminMovies from './useAdminMovies';

const empty = {};
const noPlans = [];
export default function useAdminList(collectionName, search, size) {
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        const change = event => { if (event.detail?.collectionName === collectionName) setRevision(value => value + 1); };
        window.addEventListener('mfilm-admin-data-change', change);
        return () => window.removeEventListener('mfilm-admin-data-change', change);
    }, [collectionName]);
    return useAdminMovies(search, empty, noPlans, size, revision, collectionName);
}
