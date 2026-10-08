import { useEffect, useRef, useState } from 'react';
import { FaCheck, FaChevronDown, FaSearch } from 'react-icons/fa';

export default function EpisodeRangeDropdown({ id, options, selectedIndex, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const panelId = `${id}-panel`;
    const selected = options[selectedIndex];
    const term = search.trim().replace(/^(?:tập|tap)\s*/i, '').replace(/[–—]/g, '-');
    const number = /^\d+(?:[.,]\d+)?$/.test(term) ? Number(term.replace(',', '.')) : NaN;
    const filtered = options.filter(option => Number.isFinite(number)
        ? number >= option.start && number <= option.end
        : `${option.start}-${option.end}`.includes(term));

    useEffect(() => {
        if (!open) return;
        const outside = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
        const escape = event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('keydown', escape);
        };
    }, [open]);

    const toggle = () => {
        setSearch('');
        setOpen(value => !value);
    };
    const choose = index => {
        onChange(index);
        setOpen(false);
        triggerRef.current?.focus();
    };

    return <div ref={rootRef} className={`relative w-full sm:max-w-56 min-w-0 ${open ? 'z-50' : ''}`}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
        <button id={id} ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined}
            aria-label={`Khoảng tập: ${selected?.start}–${selected?.end}`} onClick={toggle}
            onKeyDown={event => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    setSearch('');
                    setOpen(true);
                }
            }}
            className={`flex w-full h-10 items-center justify-between gap-2 rounded-full border bg-[#0d121f] px-4 text-sm font-bold tabular-nums text-yellow-400 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${open
                ? 'border-cyan-400 ring-2 ring-cyan-400/25'
                : 'border-cyan-400/40 hover:border-cyan-400/80'}`}>
            <span>{selected?.start}–{selected?.end}</span>
            <FaChevronDown aria-hidden="true" className={`shrink-0 text-[10px] text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && <div id={panelId} role="dialog" aria-label="Chọn khoảng tập" className="absolute top-full left-0 mt-2 z-100 w-[min(30rem,calc(100vw-5rem))] rounded-2xl bg-[#0f172a] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="px-4 pt-3 pb-2 border-b border-white/5">
                <div className="relative w-full group">
                    <input autoFocus type="search" value={search} onChange={event => setSearch(event.target.value)}
                        aria-label="Tìm số tập hoặc khoảng tập" placeholder="Tìm số tập hoặc khoảng tập..."
                        onKeyDown={event => {
                            if (event.key === 'Enter' && filtered.length === 1) { event.preventDefault(); choose(filtered[0].index); }
                        }}
                        className="w-full bg-slate-800/80 border border-cyan-400/40 text-cyan-100 text-[13px] rounded-full pl-9 pr-4 py-2 focus:outline-none focus:bg-slate-800 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.5),inset_0_0_10px_rgba(34,211,238,0.3)] transition-colors placeholder-cyan-400/60 hover:border-cyan-400/70 shadow-[inset_0_0_8px_rgba(34,211,238,0.1)]" />
                    <FaSearch aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 text-sm" />
                </div>
            </div>
            <div className="px-3 pb-4 pt-2 grid grid-cols-2 min-[600px]:grid-cols-3 gap-1 max-h-75 overflow-y-auto custom-scrollbar">
                {filtered.length ? filtered.map(option => <button key={option.index} type="button" aria-pressed={option.index === selectedIndex}
                    aria-label={`Tập ${option.start} đến ${option.end}`} onClick={() => choose(option.index)}
                    className={`flex items-center justify-between gap-1 rounded-lg px-2 sm:px-3 py-3 text-[13px] font-semibold tabular-nums cursor-pointer transition-colors hover:text-yellow-400 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cyan-400 ${option.index === selectedIndex ? 'text-yellow-400 bg-white/10' : 'text-gray-200'}`}>
                    <span className="whitespace-nowrap">{option.start}–{option.end}</span>
                    {option.index === selectedIndex && <FaCheck aria-hidden="true" className="shrink-0 text-[10px] text-yellow-400" />}
                </button>) : <p className="col-span-full py-6 text-center text-sm text-slate-400">Không tìm thấy khoảng tập phù hợp.</p>}
            </div>
        </div>}
    </div>;
}
