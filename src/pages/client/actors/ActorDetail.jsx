import MovieImage from '../../../components/MovieImage';
import { canonicalUrl, plainText } from '../../../utils/seo';
import { routeSegment } from '../../../utils/nameRoutes';
import { useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useActors, useAuthors, useCharacters, useMovies } from '../../../hooks/useCollections';
import { getDefaultAvatar, getSafeEntityAvatar } from '../../../utils/appUtils';
import { createNameRouteIndex } from '../../../utils/nameRoutes';
import SEO from '../../../components/SEO';
import { FaGlobe, FaVenusMars, FaInfoCircle, FaPlay, FaFilm } from 'react-icons/fa';
import './ActorDetail.css';

const EMPTY_ENTITIES = [];

function ActorDetail({ type }) {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const actors = useActors();
    const authors = useAuthors();
    const characters = useCharacters();
    const movies = useMovies();
    const entityList = type === 'actor' ? actors : type === 'author' ? authors : type === 'character' ? characters : EMPTY_ENTITIES;
    const entityTitle = type === 'actor' ? 'Diễn viên' : type === 'author' ? 'Tác giả' : type === 'character' ? 'Nhân vật' : '';
    const entityRoutes = useMemo(() => createNameRouteIndex(entityList), [entityList]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [slug]);

    const entity = useMemo(() => {
        if (!entityList || entityList.length === 0) return null;
        return entityRoutes.find(slug);
    }, [entityList, slug, entityRoutes]);

    const prefix = type === 'actor' ? '/dien-vien' : type === 'author' ? '/tac-gia' : '/nhan-vat';
    const canonicalPath = entity ? entityRoutes.path(prefix, entity) : '';
    useEffect(() => {
        if (canonicalPath && location.pathname !== canonicalPath) {
            navigate({ pathname: canonicalPath, search: location.search, hash: location.hash }, { replace: true });
        }
    }, [canonicalPath, location.pathname, location.search, location.hash, navigate]);

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
        return <div className="entity-detail entity-detail--loading" role="status" aria-label="Đang tải thông tin"><div className="animate-spin rounded-full h-10 w-10 border-2 border-yellow-500/20 border-t-yellow-400"></div></div>;
    }

    if (!entity) {
        return (
            <div className="entity-detail entity-detail--loading px-4 text-white">
                <h1 className="text-4xl font-bold mb-4">Không tìm thấy {entityTitle.toLowerCase()}</h1>
                <p className="text-slate-400 mb-8">Có thể dữ liệu đã bị xóa hoặc đường dẫn không chính xác.</p>
                <button onClick={() => navigate(-1)} className="entity-detail__back">Quay lại</button>
            </div>
        );
    }

    const genderText = entity.sexID === 'Male' ? 'Nam' : entity.sexID === 'Female' ? 'Nữ' : entity.sexID === 'Other' ? 'Khác' : entity.sexID || 'Chưa rõ';

    return (
        <div className="entity-detail">
            <SEO 
                title={`${entity.name} - ${entityTitle} | MFILM`}
                description={`Thông tin chi tiết và danh sách phim của ${entityTitle.toLowerCase()} ${entity.name}.`}
                url={canonicalPath}
                image={entity.imgUrl || entity.avatar}
                noindex={entityMovies.length === 0 && (!entity.description || /^Đang cập nhật/i.test(entity.description))}
                items={entityMovies}
                schema={{ "@context": "https://schema.org", "@type": type === "character" ? "Thing" : "Person", name: entity.name, url: canonicalUrl(canonicalPath), ...(!/^Đang cập nhật/i.test(entity.description || "") && { description: plainText(entity.description) }) }}
            />
            <div className="entity-detail__container">
                
                {/* Profile Section */}
                <section className="entity-detail__profile" aria-labelledby="entity-name">
                    <div className="entity-detail__portrait">
                        <img
                            src={getSafeEntityAvatar(entity.imgUrl, entity.sexID)}
                            alt={entity.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = getDefaultAvatar(entity.sexID); }}
                        />
                    </div>
                    
                    <div className="entity-detail__info">
                        <p className="entity-detail__role">{entityTitle}</p>
                        <h1 id="entity-name" className="entity-detail__name">{entity.name}</h1>
                        
                        <dl className="entity-detail__facts">
                            {entity.countriesID && (
                                <div className="entity-detail__fact">
                                    <dt><FaGlobe aria-hidden="true" /> Quốc gia</dt>
                                    <dd>{entity.countriesID}</dd>
                                </div>
                            )}
                            {genderText && (
                                <div className="entity-detail__fact">
                                    <dt><FaVenusMars aria-hidden="true" /> Giới tính</dt>
                                    <dd>{genderText}</dd>
                                </div>
                            )}
                        </dl>
                        
                        <div className="entity-detail__bio">
                            <h2><FaInfoCircle aria-hidden="true" /> Giới thiệu</h2>
                            <p>
                                {entity.description || 'Chưa có thông tin giới thiệu cho ' + entityTitle.toLowerCase() + ' này.'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Movies Section */}
                <section aria-labelledby="entity-movies-title">
                    <div className="entity-detail__section-heading">
                        <h2 id="entity-movies-title"><FaFilm aria-hidden="true" /> Phim đã tham gia</h2>
                        <span className="entity-detail__count">{entityMovies.length} phim</span>
                    </div>

                    {entityMovies.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                            {entityMovies.map((m, idx) => (
                                <Link
                                    key={m.id || m.slug || idx}
                                    to={`/phim/${routeSegment(m)}`}
                                    className="entity-detail__movie group cursor-pointer flex flex-col h-full min-w-0"
                                >
                                    <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden bg-slate-800 shadow-lg border-3 border-transparent transition duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                        <MovieImage movie={m} kind="poster" imageWidth={300} imageHeight={450} imageType="poster" alt={m.name} className="w-full h-full object-cover" loading="lazy" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40"></div>
                                        
                                        <div className="absolute top-2 right-2 flex gap-1.5">
                                            <p className="entity-detail__episode">
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
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="entity-detail__empty">
                            <FaFilm className="text-3xl text-yellow-500/70 mb-4" aria-hidden="true" />
                            <h3 className="text-slate-400 text-lg font-medium text-center px-4">
                                Chưa có phim nào trong cơ sở dữ liệu có sự tham gia của {entityTitle.toLowerCase()} này.
                            </h3>
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}

export default ActorDetail;
