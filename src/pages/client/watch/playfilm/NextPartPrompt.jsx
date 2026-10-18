import { Link } from 'react-router-dom';
import { FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import MovieImage from '../../../../components/MovieImage';
import { routeSegment } from '../../../../utils/nameRoutes';

export default function NextPartPrompt({ current, next, onCancel }) {
    return <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="next-part-heading" className="w-full max-w-md rounded-2xl border border-yellow-400/25 bg-[#111827] p-5 shadow-2xl sm:p-6">
            <p className="flex items-center gap-2 text-xs font-medium text-slate-400"><FaCheckCircle className="text-emerald-400" aria-hidden="true" /> Bạn đã xem hết {current?.partNumber ? `Phần ${current.partNumber}` : 'phần hiện tại'}</p>
            <h2 id="next-part-heading" className="mt-2 text-xl font-bold text-white">Câu chuyện vẫn tiếp tục</h2>
            <div className="my-5 flex items-center gap-4 rounded-xl border border-white/8 bg-white/3 p-3">
                <MovieImage movie={next} imageWidth={150} imageHeight={225} alt={next.otherName || next.name} className="h-28 w-19 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0">
                    <p className="text-xs font-bold text-yellow-400">PHẦN {next.partNumber}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">{next.otherName || next.name}</p>
                    <p className="mt-2 text-xs text-slate-400">{[next.releaseYear || next.year, Number(next.endEpisode) > 0 ? `${next.endEpisode} tập` : null].filter(Boolean).join(' · ')}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Link to={`/phim/${routeSegment(next)}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-yellow-300">{next.status === 'Sắp chiếu' ? 'Xem thông tin' : `Xem tiếp Phần ${next.partNumber}`} <FaArrowRight aria-hidden="true" /></Link>
                <button onClick={onCancel} className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-white/5">Để sau</button>
            </div>
        </div>
    </div>;
}
