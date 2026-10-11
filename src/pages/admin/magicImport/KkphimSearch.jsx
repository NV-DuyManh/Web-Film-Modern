import React, { useEffect, useRef, useState } from 'react';
import { FaSearch, FaCloudDownloadAlt, FaCheck, FaSpinner, FaTimes } from 'react-icons/fa';
import { searchMovies, getFullImageUrl } from '../../../services/kkphimService';
import { searchResults, existingSourceMovie } from '../../../utils/kkphimSearch';
import { selectedMovieOptions, CRAWLER_ACTIVE } from '../../../utils/crawlerJob';
import { queueCrawlerJob } from '../../../services/crawlerJobService';

const types = { single: 'Movie', series: 'Series', hoathinh: 'Animation', tvshows: 'TV Show' };

export default function KkphimSearch({ existingMovies, crawlReady, crawlStatus, crawlStats, crawlLogs, crawlProgress, onViewJob }) {
    const [keyword, setKeyword] = useState('');
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selection, setSelection] = useState([]);
    const [queueing, setQueueing] = useState(false);
    const [queued, setQueued] = useState(false);
    const [message, setMessage] = useState('');
    const request = useRef(null);
    const queueLock = useRef(false);
    const active = CRAWLER_ACTIVE.includes(crawlStatus);

    useEffect(() => () => request.current?.abort(), []);

    const search = async (text, page = 1) => {
        const term = text.trim();
        request.current?.abort();
        if (!term) { setError('Enter a movie name to search KKPhim.'); return; }
        const controller = new AbortController();
        request.current = controller;
        setQuery(term); setLoading(true); setError(''); setResult(null);
        try {
            const data = await searchMovies(term, page, 12, { signal: controller.signal });
            if (!controller.signal.aborted) setResult(searchResults(data));
        } catch (err) {
            if (!controller.signal.aborted) setError(err.name === 'TimeoutError' ? 'KKPhim took too long to respond. Please try again.' : `Search failed: ${err.message}`);
        } finally {
            if (request.current === controller) setLoading(false);
        }
    };

    const toggle = item => {
        setMessage('');
        setSelection(previous => previous.some(movie => movie.slug === item.slug)
            ? previous.filter(movie => movie.slug !== item.slug)
            : previous.length < 20 ? [...previous, item] : previous);
    };

    const importSelected = async () => {
        if (queueLock.current || !selection.length || active || !crawlReady) return;
        queueLock.current = true; setQueueing(true); setError(''); setMessage('');
        try {
            await queueCrawlerJob(selectedMovieOptions(selection));
            setQueued(true); setSelection([]);
            setMessage('Import queued. The background worker starts on its next run, usually within a few minutes. You can close this page.');
        } catch (err) { setError(`Could not queue import: ${err.message}`); }
        finally { queueLock.current = false; setQueueing(false); }
    };

    return (
        <section className="space-y-5" aria-label="KKPhim movie search">
            <div className="rounded-2xl border border-emerald-500/25 bg-slate-900/90 p-5 md:p-6">
                <h2 className="flex items-center gap-2 text-emerald-400 text-lg font-bold"><FaSearch /> Search KKPhim</h2>
                <p className="text-sm text-slate-400 mt-2 mb-5">Find movies in the KKPhim library and select the ones you want to import into MFILM.</p>
                <form onSubmit={event => { event.preventDefault(); search(keyword); }} className="flex gap-3 flex-wrap">
                    <input aria-label="Movie name on KKPhim" value={keyword} onChange={event => setKeyword(event.target.value)} maxLength={150}
                        placeholder="Enter a Vietnamese or original movie name..." className="min-w-0 flex-1 basis-64 rounded-xl bg-black/30 border border-white/15 px-4 py-3 text-sm focus:outline-none focus:border-emerald-400" />
                    <button type="submit" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"><FaSearch /> Search</button>
                </form>
            </div>

            {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
            {message && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{message}</p>}

            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-semibold">Selected: {selection.length}/20</span>
                    <button onClick={importSelected} disabled={!selection.length || queueing || active || !crawlReady}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        {queueing ? <FaSpinner className="animate-spin" /> : <FaCloudDownloadAlt />} {queueing ? 'Queueing...' : 'Import selected'}
                    </button>
                </div>
                {selection.length > 0 && <div className="flex gap-2 flex-wrap">{selection.map(item => <button key={item.slug} onClick={() => toggle(item)} disabled={queueing}
                    className="flex items-center gap-2 max-w-full rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 text-xs cursor-pointer">
                    <span className="truncate">{item.name}</span><FaTimes aria-label="Remove selection" className="shrink-0" />
                </button>)}</div>}
                {active && <p className="text-xs text-amber-300">A background import is {crawlStatus}. Wait for it to finish before starting another import.</p>}
                {(active || queued) && <div className="text-sm text-slate-300 border-t border-white/10 pt-3">
                    <div className="flex justify-between gap-3 flex-wrap"><span>Import status: {crawlStatus} · {crawlProgress}% · {crawlStats.movies} imported · {crawlStats.skipped || 0} already saved · {crawlStats.errors} errors</span>
                        <button onClick={onViewJob} className="text-emerald-300 hover:text-white cursor-pointer">View import logs →</button></div>
                    {crawlLogs[0] && <p className="text-xs text-slate-400 mt-2">{crawlLogs[0].message}</p>}
                </div>}
            </div>

            {loading ? <div role="status" className="py-16 flex items-center justify-center gap-3 text-slate-400"><FaSpinner className="animate-spin" /> Searching KKPhim...</div>
                : !result ? <p className="text-center text-slate-500 py-12">Search the KKPhim library to get started.</p>
                : <>
                    <div className="text-sm text-slate-400">{result.totalItems} results for “{query}” · Page {result.page} of {result.totalPages}</div>
                    {!result.items.length && <p role="status" className="text-center py-12 text-slate-400">No movies found. Try another movie name.</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {result.items.map(item => {
                            const existing = existingSourceMovie(existingMovies, item);
                            const selected = selection.some(movie => movie.slug === item.slug);
                            const poster = getFullImageUrl(item.poster_url || item.thumb_url);
                            return <article key={item.slug} className={`flex gap-4 rounded-2xl bg-slate-900/90 border p-3 ${selected ? 'border-emerald-400' : 'border-white/10'}`}>
                                <div className="w-24 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-slate-800">
                                    {poster && <img src={poster} alt={item.name} loading="lazy" className="w-full h-full object-cover" onError={event => {
                                        const alternate = getFullImageUrl(item.thumb_url);
                                        if (alternate && event.currentTarget.src !== alternate) event.currentTarget.src = alternate;
                                        else event.currentTarget.style.visibility = 'hidden';
                                    }} />}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <h3 className="font-bold text-sm line-clamp-2" title={item.name}>{item.name}</h3>
                                    <p className="text-xs text-slate-400 line-clamp-2 mt-1" title={item.origin_name}>{item.origin_name}</p>
                                    <p className="text-xs text-emerald-300 mt-2">{item.year || '—'} · {types[item.type] || 'Movie'} {item.quality ? `· ${item.quality}` : ''}</p>
                                    {existing && <span className="text-xs text-slate-400 mt-2">Already in MFILM</span>}
                                    <button onClick={() => toggle(item)} aria-label={`${selected ? 'Deselect' : 'Select'} ${item.name}`} aria-pressed={selected}
                                        disabled={!!existing || queueing || (!selected && selection.length >= 20)}
                                        className={`mt-auto pt-3 text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${selected ? 'text-emerald-300' : 'text-white'}`}>
                                        {selected && <FaCheck />} {existing ? 'Already imported' : selected ? 'Selected' : 'Select movie'}
                                    </button>
                                </div>
                            </article>;
                        })}
                    </div>
                    {result.totalPages > 1 && <nav aria-label="KKPhim search pages" className="flex items-center justify-center gap-4 pt-3">
                        <button disabled={result.page <= 1} onClick={() => search(query, result.page - 1)} className="rounded-lg border border-white/15 px-4 py-2 disabled:opacity-30 cursor-pointer">Previous</button>
                        <span className="text-sm">{result.page} / {result.totalPages}</span>
                        <button disabled={result.page >= result.totalPages} onClick={() => search(query, result.page + 1)} className="rounded-lg border border-white/15 px-4 py-2 disabled:opacity-30 cursor-pointer">Next</button>
                    </nav>}
                </>}
        </section>
    );
}
