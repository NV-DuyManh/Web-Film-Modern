import { useId, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Treemap } from 'recharts';
import { FaChartPie, FaGlobeAsia, FaLayerGroup, FaShapes, FaTicketAlt, FaShieldAlt, FaCrown, FaGem } from 'react-icons/fa';
import { polarSector, genreBalance } from '../../../utils/dashboardCharts';
import './DashboardCharts.css';

export function ChartPanel({ title, subtitle, icon = FaChartPie, loading = false, error = false, empty = false, children }) {
    const Icon = icon;
    const id = useId();
    return <section aria-labelledby={id} className="rounded-[14px] p-5 relative overflow-hidden h-full border border-white/5" style={{ background: 'rgba(15, 23, 42, 0.92)', containerType: 'inline-size' }}>
        <div className="mb-4"><div className="flex items-center gap-2.5"><Icon className="text-amber-400 text-xl shrink-0" aria-hidden="true" /><h2 id={id} className="text-xl font-semibold text-gray-100">{title}</h2></div><p className="text-sm text-gray-400 mt-1">{subtitle}</p></div>
        {loading ? <div role="status" className="h-72 flex items-center justify-center"><div className="w-36 h-36 rounded-full border-[20px] border-slate-700/40 motion-safe:animate-pulse" /><span className="sr-only">Loading {title}</span></div>
            : empty ? <div className="h-72 flex items-center justify-center text-slate-400 text-sm">{error ? 'Unable to load this chart. Please try again.' : 'No data available yet'}</div> : children}
    </section>;
}

function PlanKey({ data, selected, onSelect }) {
    const total = data.reduce((sum, row) => sum + row.value, 0);
    const icons = { Free: FaTicketAlt, Basic: FaShieldAlt, Plus: FaCrown, Premium: FaGem };
    return <ul className="admin-chart-key">{data.map(row => {
        const Icon = icons[row.name] || FaTicketAlt;
        const percentage = Math.round(row.value / total * 100);
        return <li key={row.name}><button type="button" aria-label={`${row.name}: ${row.value} accounts, ${percentage}%`} aria-pressed={selected === row.name} onClick={() => onSelect(selected === row.name ? null : row.name)} className="focus-visible:outline focus-visible:outline-cyan-400">
            <div className="key-head"><Icon style={{ color: row.color }} aria-hidden="true" /><span>{row.name}</span><span className="key-value">{row.value}</span></div>
            <div className="key-detail"><span>{row.value === 1 ? 'Member' : 'Members'}</span><span>{percentage}% of clients</span></div>
            <div className="key-track" aria-hidden="true"><span style={{ width: `${percentage}%`, background: row.color }} /></div>
        </button></li>;
    })}</ul>;
}

export function ChartTooltip({ active, payload, label, format = value => Number(value).toLocaleString('en-US') }) {
    if (!active || !payload?.length) return null;
    return <div className="rounded-xl border border-slate-600/50 bg-slate-950/95 px-4 py-3 shadow-xl text-sm">
        {label && <p className="font-semibold text-slate-100 mb-2">{label}</p>}
        {payload.map((entry, index) => <p key={`${entry.name}-${index}`} className="flex items-center gap-2 text-slate-300"><span className="h-2 w-2 rounded-full" style={{ background: entry.payload?.color || entry.color }} /><span>{entry.name}</span><strong className="text-white ml-2">{format(entry.value)}</strong></p>)}
    </div>;
}

function DataLegend({ data, unit, selected, onSelect }) {
    const total = data.reduce((sum, row) => sum + row.value, 0);
    return <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 mt-3 text-xs sm:text-sm">
        {data.map(row => <li key={row.name}>{onSelect ? <button type="button" aria-pressed={selected === row.name} onClick={() => onSelect(selected === row.name ? null : row.name)} className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-700/40 aria-pressed:bg-slate-700/40 focus-visible:outline focus-visible:outline-cyan-400"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.color }} /><span className="text-slate-300">{row.name}</span><span className="ml-auto text-slate-100 tabular-nums">{row.value} <span className="text-slate-400">({Math.round(row.value / total * 100)}%)</span></span></button>
            : <div className="flex items-center gap-2 py-1"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.color }} /><span className="text-slate-300">{row.name}</span><span className="ml-auto text-slate-100 tabular-nums">{row.value} <span className="text-slate-400">{unit}</span></span></div>}</li>)}
    </ul>;
}

export function MembershipChart({ data, loading, error }) {
    const id = useId();
    const [selected, setSelected] = useState(null);
    const selection = data.find(row => row.name === selected);
    const total = data.reduce((sum, row) => sum + row.value, 0);
    return <ChartPanel title="Membership Mix" subtitle="Current plans across client accounts" loading={loading} error={error} empty={!data.length}>
        <div className="admin-chart-split"><div className="h-72" aria-label={`Membership distribution, ${total} client accounts`}>
            <ResponsiveContainer width="100%" height="100%"><PieChart><defs>
                {data.map((row, index) => <linearGradient key={row.name} id={`${id}-tier-${index}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={row.color} /><stop offset="100%" stopColor={`color-mix(in srgb, ${row.color} 60%, #334155)`} /></linearGradient>)}
                <radialGradient id={`${id}-center`}><stop offset="0%" stopColor="#1e293b" stopOpacity=".7" /><stop offset="100%" stopColor="#0f172a" stopOpacity="0" /></radialGradient>
            </defs><circle cx="50%" cy="50%" r="64" fill={`url(#${id}-center)`} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="88%" paddingAngle={3} cornerRadius={7} stroke="none" isAnimationActive={false}>
                {data.map((row, index) => <Cell key={row.name} fill={`url(#${id}-tier-${index})`} fillOpacity={!selection || selection.name === row.name ? 1 : 0.2} style={{ filter: !selection || selection.name === row.name ? `drop-shadow(0 3px 7px ${row.color}22)` : 'none' }} />)}
            </Pie><text x="50%" y="50%" textAnchor="middle" fill="#f1f5f9" fontSize={42} fontWeight={800}>{selection?.value ?? total}</text><text x="50%" y="61%" textAnchor="middle" fill="#94a3b8" fontSize={11} letterSpacing={1.3}>{selection?.name.toUpperCase() || 'CLIENT ACCOUNTS'}</text><Tooltip content={<ChartTooltip format={value => `${value} accounts · ${Math.round(value / total * 100)}%`} />} /></PieChart></ResponsiveContainer>
        </div><PlanKey data={data} selected={selected} onSelect={setSelected} /></div>
    </ChartPanel>;
}

export function OriginsChart({ data, loading, error }) {
    const id = useId();
    const [selected, setSelected] = useState(null);
    const selection = data.find(row => row.name === selected);
    const maximum = Math.max(...data.map(row => row.value), 1);
    const ceiling = Math.ceil(maximum / 50) * 50;
    return <ChartPanel title="Movie Origins" subtitle="Movie library by production country" icon={FaGlobeAsia} loading={loading} error={error} empty={!data.length}>
        <div className="h-72 flex items-center justify-center"><svg viewBox="0 0 280 280" className="h-full max-w-full" role="img" aria-label={data.map(row => `${row.name}: ${row.value} movies`).join(', ')}>
            <defs>{data.map((row, index) => <radialGradient key={row.name} id={`${id}-country-${index}`}><stop offset="0%" stopColor={row.color} stopOpacity=".6" /><stop offset="100%" stopColor={row.color} /></radialGradient>)}</defs>
            {[.25, .5, .75, 1].map(scale => <circle key={scale} cx="140" cy="140" r={118 * Math.sqrt(scale)} fill="none" stroke="#334155" strokeOpacity={.5} strokeWidth={1} />)}
            {data.map((row, index) => <path key={row.name} d={polarSector(index, data.length, row.value, ceiling, 118)} fill={`url(#${id}-country-${index})`} fillOpacity={!selection || selection.name === row.name ? 0.95 : 0.18} stroke="#0f172a" strokeWidth={3} onMouseEnter={() => setSelected(row.name)} onMouseLeave={() => setSelected(null)}><title>{row.name}: {row.value} movies</title></path>)}
            <text x="145" y="14" fill="#94a3b8" fontSize={11}>{ceiling} movies</text>
        </svg></div>
        <p aria-live="polite" className="h-5 text-center text-sm text-slate-300">{selection ? `${selection.name} · ${selection.value.toLocaleString('en-US')} movies` : `${data.reduce((sum, row) => sum + row.value, 0).toLocaleString('en-US')} movies in total`}</p>
        <DataLegend data={data} unit="films" selected={selected} onSelect={setSelected} />
    </ChartPanel>;
}

function GenreTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return <div className="rounded-xl border border-slate-600/50 bg-slate-950/95 px-4 py-3 shadow-xl text-sm"><p className="font-semibold text-white mb-2">{label || row.name}</p>
        <p className="text-cyan-300">Films: <strong>{row.filmShare}%</strong><span className="text-slate-400"> · {row.films} titles</span></p>
        <p className="text-pink-300">Series: <strong>{row.seriesShare}%</strong><span className="text-slate-400"> · {row.series} titles</span></p>
    </div>;
}

export function GenreChart({ data, loading, error }) {
    const id = useId();
    const balanced = genreBalance(data);
    return <ChartPanel title="Genre Mix" subtitle="Film vs series share within each genre (%)" icon={FaShapes} loading={loading} error={error} empty={!balanced.length}>
        <div className="h-80" aria-label="Percentage of films versus series within each of the top six primary genres"><ResponsiveContainer width="100%" height="100%"><RadarChart data={balanced} outerRadius="76%">
            <defs><linearGradient id={`${id}-films`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity=".4" /><stop offset="100%" stopColor="#3b82f6" stopOpacity=".1" /></linearGradient><linearGradient id={`${id}-series`} x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f472b6" stopOpacity=".35" /><stop offset="100%" stopColor="#a855f7" stopOpacity=".12" /></linearGradient></defs>
            <PolarGrid stroke="#334155" /><PolarAngleAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} /><PolarRadiusAxis tick={false} domain={[0, 100]} ticks={[25, 50, 75, 100]} axisLine={false} />
            <Radar name="Films" dataKey="filmShare" stroke="#22d3ee" fill={`url(#${id}-films)`} fillOpacity={1} strokeWidth={3} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} isAnimationActive={false} />
            <Radar name="Series" dataKey="seriesShare" stroke="#f472b6" fill={`url(#${id}-series)`} fillOpacity={1} strokeWidth={3} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} isAnimationActive={false} />
            <Tooltip content={<GenreTooltip />} /><Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        </RadarChart></ResponsiveContainer></div>
        <p className="text-xs text-slate-400 text-center mt-2">Each genre totals 100% · Hover to see title counts</p>
    </ChartPanel>;
}

function PlanTile({ x, y, width, height, name, value, color, depth }) {
    const id = useId();
    if (depth !== 1) return null;
    return <g><defs><linearGradient id={`${id}-tile`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={`color-mix(in srgb, ${color} 62%, #0f172a)`} /><stop offset="100%" stopColor={`color-mix(in srgb, ${color} 28%, #0f172a)`} /></linearGradient></defs><rect x={x} y={y} width={width} height={height} rx={14} fill={`url(#${id}-tile)`} /><title>{name}: {value} movies</title>
        <rect x={x + 10} y={y + 10} width={Math.max(0, width - 20)} height={3} rx={2} fill={color} fillOpacity=".8" />
        {width > 62 && height > 48 && <><text x={x + width / 2} y={y + height / 2 - 12} textAnchor="middle" fill="#f8fafc" fontWeight={700} fontSize={width > 140 ? 20 : 14}>{name}</text><text x={x + width / 2} y={y + height / 2 + 18} textAnchor="middle" fill="#f1f5f9" fontWeight={600} fontSize={width > 140 ? 22 : 16}>{value.toLocaleString('en-US')}</text>{height > 100 && <text x={x + width / 2} y={y + height / 2 + 39} textAnchor="middle" fill="#cbd5e1" fontSize={11}>movies</text>}</>}
    </g>;
}

export function LibraryPlanChart({ data, loading, error }) {
    return <ChartPanel title="Library by Plan" subtitle="Required membership for each movie" icon={FaLayerGroup} loading={loading} error={error} empty={!data.length}>
        <div className="h-72" aria-label="Movies grouped by required membership plan"><ResponsiveContainer width="100%" height="100%"><Treemap data={data} dataKey="value" nameKey="name" content={<PlanTile />} nodeGap={9} isAnimationActive={false}><Tooltip content={<ChartTooltip format={value => `${value} movies`} />} /></Treemap></ResponsiveContainer></div>
        <DataLegend data={data} unit="films" />
    </ChartPanel>;
}
