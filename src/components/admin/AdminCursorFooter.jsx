export default function AdminCursorFooter({ page, previous, next, hasNext, loading, rows, total }) {
    return <div className="flex flex-wrap items-center justify-between gap-3 p-3 text-slate-300 text-sm border-t border-white/10">
        <span>Trang {page} · {rows.length} mục{total !== null ? ` · Tổng ${total}` : ''}</span>
        <div className="flex gap-3"><button className="rounded-lg border border-amber-400/30 text-amber-300 px-3 py-2 disabled:opacity-40" disabled={loading || page <= 1} onClick={previous}>Trang trước</button><button className="rounded-lg border border-amber-400/30 text-amber-300 px-3 py-2 disabled:opacity-40" disabled={loading || !hasNext} onClick={next}>Trang sau</button></div>
    </div>;
}
