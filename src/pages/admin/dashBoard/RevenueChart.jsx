import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaChartBar } from 'react-icons/fa';
import { formatAdminMoney } from '../../../utils/adminRevenue';
import { ChartPanel, ChartTooltip } from './DashboardCharts';

function formatMonth(value) {
    const [year, month] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export default function RevenueChart({ currency = 'USD', data = [], loading = false, error = false }) {
    return <ChartPanel title="Revenue Overview" subtitle={`Successful payments by month · ${currency} · Stacked columns`} icon={FaChartBar} loading={loading} error={error} empty={!data.length}>
        <div className="h-72" aria-label={`Monthly membership and movie rental revenue in ${currency}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 8 }} barCategoryGap="25%">
            <defs><linearGradient id="membership-revenue-bars" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient><linearGradient id="rental-revenue-bars" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ec4899" /><stop offset="100%" stopColor="#fb923c" /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#253148" strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis tickFormatter={value => formatAdminMoney(value, currency)} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
            <Tooltip labelFormatter={formatMonth} content={<ChartTooltip format={value => formatAdminMoney(value, currency)} />} cursor={{ fill: '#64748b', opacity: .08 }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="memberships" name="Memberships" stackId="revenue" fill="url(#membership-revenue-bars)" maxBarSize={82} isAnimationActive={false} />
            <Bar dataKey="rentals" name="Movie rentals" stackId="revenue" fill="url(#rental-revenue-bars)" radius={[6, 6, 0, 0]} maxBarSize={82} isAnimationActive={false} />
        </BarChart></ResponsiveContainer></div>
    </ChartPanel>;
}
