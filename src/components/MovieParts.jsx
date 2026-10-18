import { Link } from 'react-router-dom';
import { FaLayerGroup, FaCheck, FaArrowRight } from 'react-icons/fa';
import MovieImage from './MovieImage';
import { routeSegment } from '../utils/nameRoutes';

export default function MovieParts({ movie, group, watching = false }) {
    if (group.parts.length < 2) return null;
    return <section aria-label="Các phần của phim" className="min-w-0 max-w-full rounded-2xl border border-yellow-400/15 bg-linear-to-br from-yellow-400/4 via-slate-950/30 to-slate-950/60 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400"><FaLayerGroup aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white sm:text-lg">Các phần của phim</h3>
                <p className="mt-0.5 truncate text-xs text-slate-400">{group.title} <span className="mx-1 text-slate-600">·</span> {group.parts.length} phần</p>
            </div>
            <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-slate-500 sm:inline">Thứ tự xem</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" aria-busy={group.loading}>
            {group.parts.map(part => {
                const selected = part.id === movie.id;
                return <Link key={part.id} to={`/phim/${routeSegment(part)}`} aria-current={selected ? 'page' : undefined}
                    className={`group flex w-52 shrink-0 items-center gap-3 rounded-xl border p-2.5 transition-colors sm:w-56 ${selected ? 'border-yellow-400/65 bg-yellow-400/8' : 'border-white/8 bg-slate-950/35 hover:border-yellow-400/35 hover:bg-white/4'}`}>
                    <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                        {group.loading && !selected ? <div className="h-full w-full animate-pulse bg-slate-700/50" /> : <MovieImage movie={part} imageWidth={120} imageHeight={180} alt={part.otherName || part.name} loading="lazy" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-bold ${selected ? 'text-yellow-400' : 'text-slate-100 group-hover:text-yellow-300'}`}>Phần {part.partNumber}</span>
                            {selected ? <FaCheck aria-hidden="true" className="text-[10px] text-yellow-400" /> : <FaArrowRight aria-hidden="true" className="text-[10px] text-slate-600 group-hover:text-yellow-400" />}
                        </div>
                        <p className="mt-1 truncate text-[11px] text-slate-400">{[part.releaseYear || part.year, Number(part.endEpisode) > 0 ? `${part.endEpisode} tập` : null].filter(Boolean).join(' · ') || 'Xem thông tin'}</p>
                        {selected && <p className="mt-2 text-[10px] font-semibold text-yellow-400/85">{watching ? 'Đang xem' : 'Đang chọn'}</p>}
                        {!selected && <p className="mt-2 text-[10px] text-slate-500">{part.status === 'Sắp chiếu' ? 'Sắp chiếu' : 'Xem phần này'}</p>}
                    </div>
                </Link>;
            })}
        </div>
    </section>;
}
