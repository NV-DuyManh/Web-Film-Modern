import { FaWallet, FaCrown, FaFilm, FaReceipt, FaPhotoVideo, FaUsers } from 'react-icons/fa';
import { formatAdminMoney } from '../../../utils/adminRevenue';

const total = rows => rows.reduce((sum, row) => sum + Number(row.price), 0);
const payments = count => `${count} ${count === 1 ? 'payment' : 'payments'}`;
const countLabel = count => count == null ? '—' : count.toLocaleString('en-US');

export default function DashboardStats({ period, subscriptions, rentals, movieCount, userCount }) {
    const invalidDates = period.from && period.to && period.from > period.to;
    const cards = [
        { title: 'Total revenue', value: formatAdminMoney(total(subscriptions) + total(rentals), period.currency), detail: `Total paid · ${period.currency}`, Icon: FaWallet, gradient: 'from-blue-600 via-indigo-500 to-purple-600', glow: 'shadow-[0_8px_20px_rgba(79,70,229,0.22)]' },
        { title: 'Memberships', value: formatAdminMoney(total(subscriptions), period.currency), detail: payments(subscriptions.length), Icon: FaCrown, gradient: 'from-rose-500 via-red-500 to-orange-500', glow: 'shadow-[0_8px_20px_rgba(239,68,68,0.22)]' },
        { title: 'Movie rentals', value: formatAdminMoney(total(rentals), period.currency), detail: payments(rentals.length), Icon: FaFilm, gradient: 'from-emerald-500 via-teal-500 to-cyan-600', glow: 'shadow-[0_8px_20px_rgba(16,185,129,0.22)]' },
        { title: 'Transactions', value: countLabel(subscriptions.length + rentals.length), detail: `Paid in ${period.currency}`, Icon: FaReceipt, gradient: 'from-fuchsia-600 via-pink-500 to-rose-500', glow: 'shadow-[0_8px_20px_rgba(236,72,153,0.22)]' },
        { title: 'Total movies', value: countLabel(movieCount), detail: 'Entire movie library', Icon: FaPhotoVideo, gradient: 'from-yellow-400 via-yellow-500 to-amber-600', glow: 'shadow-[0_8px_20px_rgba(234,179,8,0.22)]', global: true },
        { title: 'Total users', value: countLabel(userCount), detail: 'All registered accounts', Icon: FaUsers, gradient: 'from-cyan-400 via-sky-500 to-blue-600', glow: 'shadow-[0_8px_20px_rgba(14,165,233,0.22)]', global: true },
    ];
    return (
        <section aria-label="Dashboard totals">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <h2 className="bg-linear-to-r from-cyan-300 via-fuchsia-400 to-amber-200 bg-clip-text text-lg font-bold text-transparent">At a glance</h2>
                <p className="text-[11px] text-slate-500">Payments follow the filters above · Movies and users are all-time totals</p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6" aria-live="polite">
                {cards.map(({ title, value, detail, Icon, gradient, glow, global }) => (
                    <article key={title} className={`min-w-0 rounded-xl bg-linear-to-br ${gradient} ${glow} flex min-h-32 flex-col items-center justify-center px-3 py-5 text-center text-white transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none sm:px-4`}>
                        <h3 className="flex items-center justify-center gap-1.5 text-xs font-bold drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"><Icon aria-hidden="true" className="shrink-0 text-[11px]" />{title}</h3>
                        <p title={value} className="mt-2 break-words text-xl font-black tracking-tight tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] sm:text-2xl xl:text-[clamp(1rem,1.35vw,1.5rem)]">{invalidDates && !global ? '—' : value}</p>
                        <p className="mt-2 text-[10px] font-semibold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] sm:text-[11px]">{detail}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
