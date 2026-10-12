import { useId, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Treemap } from 'recharts';
import { FaChartPie, FaGlobeAsia, FaLayerGroup, FaShapes } from 'react-icons/fa';
import { polarSector } from '../../../utils/dashboardCharts';

export function ChartPanel({ title, subtitle, icon = FaChartPie, loading = false, error = false, empty = false, children }) {
    const Icon = icon;
    const id = useId();
    return <section aria-labelledby={id} className="rounded-[14px] p-5 relative overflow-hidden h-full border border-white/5" style={{ background: 'rgba(15, 23, 42, 0.92)' }}>
        <div className="mb-4"><div className="flex items-center gap-2.5"><Icon className="text-amber-400 text-xl shrink-0" aria-hidden="true" /><h2 id={id} className="text-xl font-semibold text-gray-100">{title}</h2></div><p className="text-sm text-gray-400 mt-1">{subtitle}</p></div>
        {loading ? <div role="status" className="h-72 flex items-center justify-center"><div className="w-36 h-36 rounded-full border-[20px] border-slate-700/40 motion-safe:animate-pulse" /><span className="sr-only">Loading {title}</span></div>
            : empty ? <div className="h-72 flex items-center justify-center text-slate-400 text-sm">{error ? 'Unable to load this chart. Please try again.' : 'No data available yet'}</div> : children}
    </section>;
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
    const [selected, setSelected] = useState(null);
    const selection = data.find(row => row.name === selected);
    const total = data.reduce((sum, row) => sum + row.value, 0);
    return <ChartPanel title="Membership Mix" subtitle="Client accounts by current plan · Donut" loading={loading} error={error} empty={!data.length}>
        <div className="h-64" aria-label={`Membership distribution, ${total} client accounts`}>
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="85%" paddingAngle={3} cornerRadius={5} stroke="none" isAnimationActive={false}>
                {data.map(row => <Cell key={row.name} fill={row.color} fillOpacity={!selection || selection.name === row.name ? 1 : 0.25} />)}
            </Pie><text x="50%" y="48%" textAnchor="middle" fill="#f1f5f9" fontSize={30} fontWeight={800}>{selection?.value ?? total}</text><text x="50%" y="59%" textAnchor="middle" fill="#94a3b8" fontSize={13}>{selection?.name || 'Client accounts'}</text><Tooltip content={<ChartTooltip format={value => `${value} accounts · ${Math.round(value / total * 100)}%`} />} /></PieChart></ResponsiveContainer>
        </div><DataLegend data={data} selected={selected} onSelect={setSelected} />
    </ChartPanel>;
}

export function OriginsChart({ data, loading, error }) {
    const [selected, setSelected] = useState(null);
    const selection = data.find(row => row.name === selected);
    const maximum = Math.max(...data.map(row => row.value), 1);
    const ceiling = Math.ceil(maximum / 50) * 50;
    return <ChartPanel title="Movie Origins" subtitle="Library by primary country · Polar Area" icon={FaGlobeAsia} loading={loading} error={error} empty={!data.length}>
        <div className="h-64 flex items-center justify-center"><svg viewBox="0 0 280 280" className="h-full max-w-full" role="img" aria-label={data.map(row => `${row.name}: ${row.value} movies`).join(', ')}>
            {[.25, .5, .75, 1].map(scale => <circle key={scale} cx="140" cy="140" r={104 * Math.sqrt(scale)} fill="none" stroke="#334155" strokeWidth={1} />)}
            {data.map((row, index) => <path key={row.name} d={polarSector(index, data.length, row.value, ceiling)} fill={row.color} fillOpacity={!selection || selection.name === row.name ? 0.85 : 0.18} stroke="#0f172a" strokeWidth={2} onMouseEnter={() => setSelected(row.name)} onMouseLeave={() => setSelected(null)}><title>{row.name}: {row.value} movies</title></path>)}
            <text x="145" y="27" fill="#94a3b8" fontSize={12}>{ceiling} movies</text>
        </svg></div>
        <p aria-live="polite" className="h-5 text-center text-sm text-slate-300">{selection ? `${selection.name} · ${selection.value.toLocaleString('en-US')} movies` : `${data.reduce((sum, row) => sum + row.value, 0).toLocaleString('en-US')} movies in total`}</p>
        <DataLegend data={data} unit="films" selected={selected} onSelect={setSelected} />
    </ChartPanel>;
}

export function GenreChart({ data, loading, error }) {
    return <ChartPanel title="Genre Mix" subtitle="Films vs series · Top primary genres" icon={FaShapes} loading={loading} error={error} empty={!data.length}>
        <div className="h-80" aria-label="Film and series counts by primary genre"><ResponsiveContainer width="100%" height="100%"><RadarChart data={data} outerRadius="65%">
            <PolarGrid stroke="#334155" /><PolarAngleAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} /><PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} allowDecimals={false} />
            <Radar name="Films" dataKey="films" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
            <Radar name="Series" dataKey="series" stroke="#f472b6" fill="#f472b6" fillOpacity={0.2} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
            <Tooltip content={<ChartTooltip format={value => `${value} titles`} />} /><Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        </RadarChart></ResponsiveContainer></div>
    </ChartPanel>;
}

function PlanTile({ x, y, width, height, name, value, color, depth }) {
    if (depth !== 1) return null;
    const textColor = '#0f172a';
    return <g><rect x={x} y={y} width={width} height={height} rx={10} fill={color} fillOpacity={0.9} /><title>{name}: {value} movies</title>
        {width > 62 && height > 48 && <><text x={x + width / 2} y={y + height / 2 - 5} textAnchor="middle" fill={textColor} fontWeight={700} fontSize={width > 140 ? 18 : 13}>{name}</text><text x={x + width / 2} y={y + height / 2 + 17} textAnchor="middle" fill={textColor} fontSize={13}>{value.toLocaleString('en-US')} films</text></>}
    </g>;
}

export function LibraryPlanChart({ data, loading, error }) {
    return <ChartPanel title="Library by Plan" subtitle="Movie access tiers · Treemap" icon={FaLayerGroup} loading={loading} error={error} empty={!data.length}>
        <div className="h-64" aria-label="Movies grouped by required membership plan"><ResponsiveContainer width="100%" height="100%"><Treemap data={data} dataKey="value" nameKey="name" content={<PlanTile />} nodeGap={6} isAnimationActive={false}><Tooltip content={<ChartTooltip format={value => `${value} movies`} />} /></Treemap></ResponsiveContainer></div>
        <DataLegend data={data} unit="films" />
    </ChartPanel>;
}
