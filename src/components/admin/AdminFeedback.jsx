import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

export default function AdminFeedback() {
    const [notice, setNotice] = useState(null);
    useEffect(() => {
        const show = event => setNotice({ ...event.detail, key: Date.now() });
        window.addEventListener('mfilm-admin-notice', show);
        return () => window.removeEventListener('mfilm-admin-notice', show);
    }, []);
    return <Snackbar key={notice?.key} open={!!notice} autoHideDuration={notice?.severity === 'error' ? 9000 : 5000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={notice?.severity || 'success'} variant="filled" onClose={() => setNotice(null)}>{notice?.message}</Alert>
    </Snackbar>;
}
