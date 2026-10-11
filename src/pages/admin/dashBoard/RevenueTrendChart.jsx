import { FaChartLine, FaFilm, FaCrown } from 'react-icons/fa';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatAdminMoney } from '../../../utils/adminRevenue';

export default function RevenueTrendChart({ data = [], currency = 'USD', rental = false }) {
    const color = rental ? '#e879f9' : '#22d3ee';
    const id = rental ? 'rentalRevenueFill' : 'membershipRevenueFill';
    const Icon = rental ? FaFilm : FaCrown;
    const title = rental ? 'Rental revenue' : 'Membership revenue';
    const money = amount => formatAdminMoney(amount, currency);
    return (
        <section className="h-full overflow-hidden rounded-3xl border border-slate-700/40 bg-[#101727] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${color}14`, color }}><Icon aria-hidden="true" /></span>
                    <div><h2 className="text-base font-bold text-slate-100">{title}</h2><p className="mt-1 text-[11px] text-slate-500">Successful payments by day</p></div>
                </div>
                <span className="rounded-lg border border-slate-700/60 px-2 py-1 text-[10px] font-bold text-slate-400">{currency}</span>
            </div>
            <div className={`mt-5 w-full [&_*]:outline-none! ${data.length ? 'h-64' : 'h-48'}`}>
                {data.length === 0 ? (
                    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-700/60 bg-slate-950/20 px-5 text-center">
                        <FaChartLine aria-hidden="true" className="mb-3 text-3xl" style={{ color: `${color}80` }} />
                        <p className="text-sm font-semibold text-slate-300">No {currency} payments yet</p>
                        <p className="mt-2 max-w-64 text-xs leading-5 text-slate-500">Try another currency or date range. The chart appears when matching payments are available.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 16, right: 10, left: 0, bottom: 0 }}>
                            <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0.01} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="4 6" stroke="#334155" strokeOpacity={0.4} vertical={false} />
                            <XAxis dataKey="date" tickFormatter={date => date.slice(5).replace('-', '/')} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={28} dy={8} />
                            <YAxis width={64} tickFormatter={amount => new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, max => Math.max(1, max * 1.15)]} />
                            <Tooltip cursor={{ stroke: color, strokeDasharray: '4 4' }} content={({ active, payload, label }) => active && payload?.length ? <div className="rounded-xl border border-slate-600 bg-slate-950/95 p-3 shadow-xl"><p className="text-[11px] text-slate-400">{label}</p><p className="mt-1 text-sm font-bold" style={{ color }}>{money(payload[0].value)}</p></div> : null} />
                            <Area type="monotone" dataKey="revenue" name={title} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} dot={{ r: 3, fill: '#101727', stroke: color, strokeWidth: 2 }} activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-700/40 pt-3 text-[11px]"><span className="text-slate-500">Period total</span><span className="font-semibold tabular-nums" style={{ color }}>{money(data.reduce((sum, day) => sum + day.revenue, 0))}</span></div>
        </section>
    );
}
