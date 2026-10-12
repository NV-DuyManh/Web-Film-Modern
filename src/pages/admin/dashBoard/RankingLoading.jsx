export default function RankingLoading() {
    return (
        <div role="status" aria-label="Loading rankings" className="space-y-3">
            <span className="sr-only">Loading rankings…</span>
            {Array.from({ length: 5 }, (_, index) => (
                <div key={index} aria-hidden="true" className="flex items-center gap-4 p-3 rounded-xl motion-safe:animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-700/60 shrink-0" />
                    <div className="w-14 h-20 rounded-xl bg-slate-700/50 shrink-0" />
                    <div className="flex-1 space-y-3">
                        <div className="h-4 w-3/4 rounded bg-slate-700/60" />
                        <div className="h-3 w-1/2 rounded bg-slate-700/40" />
                        <div className="h-1.5 rounded bg-slate-700/40" />
                    </div>
                </div>
            ))}
        </div>
    );
}
