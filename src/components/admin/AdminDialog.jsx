import { Children, cloneElement, isValidElement, useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

function fingerprint(root) {
    return JSON.stringify([...root?.querySelectorAll('input,textarea,select') || []].filter(el => !el.disabled && el.type !== 'search').map(el => [el.name || el.id, el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value]));
}

export default function AdminDialog({ children, onClose, open, formValues, ...props }) {
    const root = useRef(null);
    const original = useRef(null);
    const originalValues = useRef('');
    const currentValues = useRef('');
    const pending = useRef(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const dirty = useCallback(() => original.current !== null && (fingerprint(root.current) !== original.current || originalValues.current !== currentValues.current), []);
    useEffect(() => {
        currentValues.current = JSON.stringify(formValues ?? null, (_, value) => typeof File !== 'undefined' && value instanceof File ? { name: value.name, size: value.size, lastModified: value.lastModified } : value);
    }, [formValues]);
    useEffect(() => {
        original.current = null;
        if (!open) return;
        const frame = requestAnimationFrame(() => { original.current = fingerprint(root.current); originalValues.current = currentValues.current; });
        const unload = event => { if (dirty()) { event.preventDefault(); event.returnValue = ''; } };
        const navigation = event => {
            const link = event.target.closest('a[href]');
            if (!link || !dirty() || event.ctrlKey || event.metaKey) return;
            event.preventDefault(); event.stopPropagation();
            pending.current = () => { original.current = null; link.click(); };
            setConfirmOpen(true);
        };
        window.addEventListener('beforeunload', unload);
        document.addEventListener('click', navigation, true);
        return () => { cancelAnimationFrame(frame); window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigation, true); };
    }, [open, dirty]);
    const close = (...args) => {
        if (!onClose) return;
        if (!dirty()) return onClose(...args);
        pending.current = () => { original.current = null; onClose(...args); };
        setConfirmOpen(true);
    };
    const decorate = nodes => Children.map(nodes, child => {
        if (!isValidElement(child)) return child;
        const text = typeof child.props.children === 'string' ? child.props.children.trim() : '';
        const isCancel = child.props.onClick && (child.props.onClick === onClose || /^(Cancel|Hủy)$/i.test(text));
        return cloneElement(child, {
            ...(isCancel ? { onClick: close } : {}),
            ...(child.props.children ? { children: decorate(child.props.children) } : {}),
        });
    });
    // close/decorate only pass event callbacks; no ref values are read while rendering.
    // eslint-disable-next-line react-hooks/refs
    return <><Dialog {...props} open={open} ref={root} onClose={close}>{decorate(children)}</Dialog>
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} aria-labelledby="admin-unsaved-title" slotProps={{ paper: { sx: { bgcolor: '#0f172a', color: '#e2e8f0', border: '1px solid #fbbf2466', borderRadius: 4 } } }}>
            <DialogTitle id="admin-unsaved-title">Thông tin chưa được lưu</DialogTitle>
            <DialogContent>Bạn có thay đổi chưa lưu. Đóng form sẽ bỏ các thay đổi này.</DialogContent>
            <DialogActions><Button onClick={() => setConfirmOpen(false)}>Tiếp tục chỉnh sửa</Button><Button color="warning" onClick={() => { setConfirmOpen(false); pending.current?.(); }}>Bỏ thay đổi</Button></DialogActions>
        </Dialog></>;
}
