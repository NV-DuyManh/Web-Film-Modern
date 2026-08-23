import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActors, useAuthors, useCharacters, useMovies } from '../../../hooks/useCollections';
import { getDefaultAvatar, getSafeEntityAvatar } from '../../../utils/appUtils';
import { getOptimizedUrl } from '../../../utils/cloudinary';
import ParticleBackground from '../../../components/client/background/ParticleBackground';
import SEO from '../../../components/SEO';
import { FaGlobe, FaVenusMars, FaInfoCircle, FaCalendarAlt, FaPlay } from 'react-icons/fa';

function ActorDetail({ type }) {
    const { slug } = useParams();
    const navigate = useNavigate();
    const actors = useActors() || [];
    const authors = useAuthors() || [];
    const characters = useCharacters() || [];
    const movies = useMovies() || [];

    const [entityList, setEntityList] = useState([]);
    const [entityTitle, setEntityTitle] = useState('');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [slug]);

    useEffect(() => {
        switch (type) {
            case 'actor':
                setEntityList(actors);
                setEntityTitle('Diễn viên');
                break;
            case 'author':
                setEntityList(authors);
                setEntityTitle('Tác giả');
                break;
            case 'character':
                setEntityList(characters);
                setEntityTitle('Nhân vật');
                break;
            default:
                setEntityList([]);
        }
    }, [type, actors, authors, characters]);

    const entity = useMemo(() => {
        if (!entityList || entityList.length === 0) return null;
        return entityList.find(e => e.slug === slug || e.id === slug);
    }, [entityList, slug]);

    const entityMovies = useMemo(() => {
        if (!entity || !movies) return [];
        return movies.filter(m => {
            if (type === 'actor') {
                const list = m.actor || m.actors || m.listActor || [];
                return list.includes(entity.id);
            }
            if (type === 'author') {
                const list = m.author ? [m.author, ...(m.listAuthor || [])] : (m.listAuthor || []);
                return list.includes(entity.id);
            }
            if (type === 'character') {
                const list = m.character || m.characters || m.listCharacter || [];
                return list.includes(entity.id);
            }
            return false;
        });
    }, [movies, entity, type]);

    if (!entityList || entityList.length === 0) {
        return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div></div>;
    }

    if (!entity) {
        return (
            <div className="w-full min-h-screen bg-[#0a0a0f] px-4 py-32 flex flex-col items-center justify-center text-white">
                <h1 className="text-4xl font-bold mb-4">Không tìm thấy {entityTitle.toLowerCase()}</h1>
                <p className="text-slate-400 mb-8">Có thể dữ liệu đã bị xóa hoặc đường dẫn không chính xác.</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer">Quay lại</button>
            </div>
        );
    }

    const genderText = entity.sexID === 'Male' ? 'Nam' : entity.sexID === 'Female' ? 'Nữ' : entity.sexID || 'Chưa rõ';

    return (
        <div className="w-full min-h-screen bg-[#0a0a0f] relative overflow-hidden" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
            <SEO 
                title={`${entity.name} - ${entityTitle} | MFILM`}
                description={`Thông tin chi tiết và danh sách phim của ${entityTitle.toLowerCase()} ${entity.name}.`}
                url={`/${type === 'actor' ? 'dien-vien' : type === 'author' ? 'tac-gia' : 'nhan-vat'}/${slug}`}
            />
            <ParticleBackground />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
                
                {/* Profile Section */}
                <div className="bg-[#131828]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 md:p-10 mb-10 shadow-2xl flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
                    
                    <div className="relative group shrink-0">
                        <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden border-4 border-slate-700 group-hover:border-[#0ea5e9] shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transition-all duration-500">
                            <img 
                                src={getSafeEntityAvatar(entity.imgUrl, entity.sexID)} 
                                alt={entity.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => { e.target.onerror = null; e.target.src = getDefaultAvatar(entity.sexID); }}
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col flex-1 text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-600 mb-2">{entity.name}</h1>
                        <p className="text-slate-400 font-medium text-sm md:text-base mb-6 uppercase tracking-widest">{entityTitle}</p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                            {entity.countriesID && (
                                <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700">
                                    <FaGlobe className="text-green-400" />
                                    <span className="text-sm font-semibold text-slate-200">{entity.countriesID}</span>
                                </div>
                            )}
                            {genderText && (
                                <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700">
                                    <FaVenusMars className="text-pink-400" />
                                    <span className="text-sm font-semibold text-slate-200">{genderText}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-left">
                            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold">
                                <FaInfoCircle />
                                <h3>Giới thiệu</h3>
                            </div>
                            <p className="text-slate-300 text-sm md:text-base leading-relaxed text-justify">
                                {entity.description || 'Chưa có thông tin giới thiệu cho ' + entityTitle.toLowerCase() + ' này.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Movies Section */}
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1.5 h-8 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white m-0">Phim Đã Tham Gia</h2>
                    </div>

                    {entityMovies.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                            {entityMovies.map((m, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigate(`/phim/${m.slug || m.id}`)}
                                    className="group cursor-pointer flex flex-col h-full"
                                >
                                    <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden bg-slate-800 shadow-lg border-3 border-transparent transition duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                        <img src={getOptimizedUrl(m.imgUrl, 300, 450, 'poster')} alt={m.name} className="w-full h-full object-cover" loading="lazy" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40"></div>
                                        
                                        <div className="absolute top-2 right-2 flex gap-1.5">
                                            <p className="bg-blue-600/90 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                                               {m.endEpisode || 0} tập 
                                            </p>
                                        </div>

                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#facc15] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 shadow-[0_0_20px_rgba(250,204,21,0.6)]">
                                            <FaPlay className="text-black ml-1" />
                                        </div>
                                    </div>
                                    <div className="pt-2 px-1 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                                        <h3 className="m-0 text-sm md:text-base font-bold text-white truncate w-full transition-colors group-hover:text-[#facc15]">{m.name}</h3>
                                        <p className="m-0 mt-0.5 text-slate-400 text-[10px] md:text-xs truncate w-full">{m.otherName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                            <div className="text-5xl text-slate-500 mb-4">🎬</div>
                            <h3 className="text-slate-400 text-lg font-medium text-center px-4">
                                Chưa có phim nào trong cơ sở dữ liệu có sự tham gia của {entityTitle.toLowerCase()} này.
                            </h3>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default ActorDetail;
