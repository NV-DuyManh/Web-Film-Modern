import { FaFilm } from 'react-icons/fa';
import { ChartPanel } from './DashboardCharts';

const fills = {
    Films: 'linear-gradient(90deg, #2563eb, #22d3ee)',
    Series: 'linear-gradient(90deg, #a855f7, #f472b6)',
    Animation: 'linear-gradient(90deg, #00bfa5, #34d399)',
    'TV Shows': 'linear-gradient(90deg, #f59e0b, #facc15)',
    Other: 'linear-gradient(90deg, #64748b, #a5b4fc)',
};

export default function LibraryFormatChart({ data = [], loading = false, error = false }) {
    const total = data.reduce((sum, row) => sum + row.value, 0);
    const maximum = Math.max(...data.map(row => row.value), 1);
    return <ChartPanel title="Library Composition" subtitle="Movie formats across the entire library" icon={FaFilm} loading={loading} error={error} empty={!data.length}>
        <div className="min-h-72 flex flex-col justify-center gap-6" aria-label={data.map(row => `${row.name}: ${row.value} titles`).join(', ')}>
            {data.map(row => <div key={row.name}>
                <div className="flex items-center justify-between gap-3 mb-2.5">
                    <span className="text-sm font-semibold text-slate-200">{row.name}</span>
                    <div className="flex items-baseline gap-2 tabular-nums"><strong className="text-base text-white">{row.value.toLocaleString('en-US')}</strong><span className="text-xs text-slate-400 w-10 text-right">{Math.round(row.value / total * 100)}%</span></div>
                </div>
                <div className="h-3 rounded-full bg-slate-700/35 overflow-hidden" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${row.value / maximum * 100}%`, background: fills[row.name] || fills.Other }} /></div>
            </div>)}
        </div>
        <div className="flex items-center justify-between border-t border-slate-700/40 pt-3 mt-5 text-xs"><span className="text-slate-400">Total library</span><span className="font-semibold text-slate-200 tabular-nums">{total.toLocaleString('en-US')} titles</span></div>
    </ChartPanel>;
}
