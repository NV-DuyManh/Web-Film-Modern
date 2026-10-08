import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useActors } from '../../../../hooks/useCollections';
import { createActorRouteIndex } from '../../../../utils/actorRoutes';
import { getDefaultAvatar, getSafeEntityAvatar } from '../../../../utils/appUtils';

// Only mounted when the cast tab opens; the movie page keeps its targeted reads.
export default function ActorCast({ actors }) {
    const catalog = useActors();
    const actorRoutes = useMemo(() => createActorRouteIndex(catalog), [catalog]);
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 py-4">
            {actors.length > 0 ? actors.map((actor, index) => (
                <Link to={catalog.length ? actorRoutes.path(actor) : '#'} aria-disabled={!catalog.length} onClick={event => { if (!catalog.length) event.preventDefault(); }} key={actor.id || index} className="flex flex-col items-center gap-2 relative group cursor-pointer">
                    <img
                        src={getSafeEntityAvatar(actor.imgUrl, actor.sexID)}
                        alt={actor.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-3 border-slate-700 group-hover:border-[#facc15] group-hover:shadow-[0_0_20px_rgba(250,204,21,0.5)] group-hover:-translate-y-2 transition duration-300"
                        onError={e => { e.target.onerror = null; e.target.src = getDefaultAvatar(actor.sexID); }}
                    />
                    <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-[#facc15] transition-colors w-full truncate text-center mt-1">{actor.name}</p>
                    {actor.role && <p className="text-[10px] sm:text-xs text-slate-400 text-center truncate w-full">{actor.role}</p>}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none z-20 flex flex-col items-center">
                        <div className="bg-[#0f1322]/90 backdrop-blur-md text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-yellow-500/30 shadow-[0_5px_20px_rgba(250,204,21,0.2)] whitespace-nowrap">{actor.name}</div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-5 border-r-5 border-t-5 border-l-transparent border-r-transparent border-t-yellow-500/30"></div>
                        <div className="absolute -bottom-0.75 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#0f1322]/90"></div>
                    </div>
                </Link>
            )) : (
                <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-[#131828]/60 rounded-2xl border border-slate-800/60">Chưa có thông tin diễn viên cho bộ phim này.</div>
            )}
        </div>
    );
}
