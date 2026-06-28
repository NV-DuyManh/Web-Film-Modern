import { useState, useEffect } from 'react';
import { MdDeleteSweep } from 'react-icons/md';

export function useSelectRows(currentData, resetTrigger) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [openBulk, setOpenBulk] = useState(false);

    useEffect(() => {
        setSelectedIds([]);
    }, [resetTrigger]);

    const currentPageIds = currentData.map(row => row.id);
    const isAllSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));
    const isIndeterminate = currentPageIds.some(id => selectedIds.includes(id)) && !isAllSelected;

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
        } else {
            setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const clearSelected = () => setSelectedIds([]);

    return { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected };
}

export default function DeleteBar({ count, onDelete }) {
    if (count === 0) return null;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            marginBottom: '12px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '10px',
        }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fca5a5' }}>
                {count} item{count > 1 ? 's' : ''} selected
            </span>
            <button
                onClick={onDelete}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 14px',
                    background: 'linear-gradient(90deg, #f97316, #ef4444)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                }}
            >
                <MdDeleteSweep style={{ fontSize: '16px' }} />
                Delete Selected
            </button>
        </div>
    );
}