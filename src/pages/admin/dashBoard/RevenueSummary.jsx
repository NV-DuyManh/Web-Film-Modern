import { FaCalendarAlt, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

export default function RevenueSummary({ period, setPeriod, subscriptions, rentals, counts }) {
    const invalidDates = period.from && period.to && period.from > period.to;
    const transactions = subscriptions.length + rentals.length;
    const otherCurrency = period.currency === 'VND' ? 'USD' : 'VND';
    return (
        <section className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-linear-to-br from-[#121e32] via-[#101728] to-[#141329] p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">Payment analytics</p>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Revenue dashboard</h2>
                    <p className="mt-1.5 text-xs leading-5 text-slate-400">Memberships and movie rentals, in one view.</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300"><FaCheckCircle aria-hidden="true" /> Successful payments</span>
            </div>
            <div className="relative mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-white/5 bg-black/15 p-3 sm:p-4">
                {['from', 'to'].map(key => <label key={key} className="min-w-0 grow basis-36 text-[11px] font-semibold text-slate-400">
                    <span className="mb-2 flex items-center gap-1.5"><FaCalendarAlt aria-hidden="true" /> {key === 'from' ? 'From date' : 'To date'}</span>
                    <input type="date" value={period[key]} max={key === 'from' ? period.to || undefined : undefined} min={key === 'to' ? period.from || undefined : undefined}
                        onInput={e => setPeriod(p => ({ ...p, [key]: e.target.value }))}
                        onChange={e => setPeriod(p => ({ ...p, [key]: e.target.value }))} style={{ colorScheme: 'dark' }}
                        className="h-10 w-full min-w-0 rounded-xl border border-slate-600/60 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15" />
                </label>)}
                <fieldset className="min-w-0 grow basis-52">
                    <legend className="mb-2 text-[11px] font-semibold text-slate-400">Payment currency</legend>
                    <div className="flex h-10 gap-1 rounded-xl border border-slate-600/60 bg-slate-900/70 p-1">
                        {['USD', 'VND'].map(currency => <button key={currency} type="button" aria-pressed={period.currency === currency} onClick={() => setPeriod(p => ({ ...p, currency }))}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-300 ${period.currency === currency ? 'bg-cyan-300 text-slate-950 shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                            <span aria-hidden="true">{currency === 'USD' ? '$' : '₫'}</span>{currency}<span className={`rounded px-1.5 text-[10px] ${period.currency === currency ? 'bg-slate-950/10' : 'bg-white/5'}`}>{counts[currency]}</span>
                        </button>)}
                    </div>
                </fieldset>
                <button type="button" onClick={() => setPeriod(p => ({ ...p, from: '', to: '' }))} className="h-10 rounded-xl border border-slate-600/60 px-4 text-xs font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300 cursor-pointer">All time</button>
            </div>
            {invalidDates && <p role="alert" className="mt-3 text-sm text-rose-300">Start date must be on or before end date.</p>}
            <div className="relative mt-4 flex items-start gap-2 text-[11px] leading-5 text-slate-400"><FaInfoCircle aria-hidden="true" className="mt-1 shrink-0 text-cyan-400" />
                <p>Amounts stay in their original payment currency. Selecting VND filters VND payments; it does not convert USD.
                    {!invalidDates && transactions === 0 && counts[otherCurrency] > 0 && <><br /><button type="button" onClick={() => setPeriod(p => ({ ...p, currency: otherCurrency }))} className="font-semibold text-cyan-300 hover:underline cursor-pointer">View {counts[otherCurrency]} {otherCurrency} payments in this period →</button></>}
                </p>
            </div>
        </section>
    );
}
