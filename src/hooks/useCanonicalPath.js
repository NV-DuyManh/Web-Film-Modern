import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Replace old bookmarks while preserving episode/server/filter query parameters.
export default function useCanonicalPath(path) {
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        if (path && location.pathname !== path) {
            navigate({ pathname: path, search: location.search, hash: location.hash }, { replace: true });
        }
    }, [path, location.pathname, location.search, location.hash, navigate]);
}
