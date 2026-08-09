import React, { useContext, useMemo, useEffect, useState } from 'react';
import { useRentMovies, useSubscriptions, useMovies } from '../../../../hooks/useCollections';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaPlay, FaHeart, FaPlus, FaShare, FaComment, FaStar, FaPaperPlane, FaCrown, FaArrowLeft } from 'react-icons/fa';
import ModalDetail from './ModalDetail';
import ModalPayMovie from '../../pay/paymovie/ModalPayMovie';
import { getExpiryDate, getUserPlanInfo } from '../../../../utils/appUtils';
import { getDefaultAvatar } from '../../../../utils/appUtils';
import { getObjectById } from '../../../../services/firebaseResponse';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { updateDocument, fetchDataById, getDocumentById } from '../../../../services/firebaseService';
import Swal from 'sweetalert2';
import ListEpisodes from '../playfilm/ListEpisodes';
import Comment from './Comment';
import SEO from '../../../../components/SEO';



function DetailFilm() {
    const { slug } = useParams();
    const [activeTab, setActiveTab] = useState('episodes');
    const [showListDropdown, setShowListDropdown] = useState(false);
    const [loginDialogState, setLoginDialogState] = useState({ open: false, title: "Yêu cầu đăng nhập", description: "Bạn cần đăng nhập tài khoản để mua hoặc thuê phim này" });
    const movies = useMovies();

    const [authorsMap, setAuthorsMap] = useState({});
    const [actorsMap, setActorsMap] = useState({});
    const [charactersMap, setCharactersMap] = useState({});
    const authors = useMemo(() => Object.values(authorsMap), [authorsMap]);
    const actors = useMemo(() => Object.values(actorsMap), [actorsMap]);
    const characters = useMemo(() => Object.values(charactersMap), [charactersMap]);

    const plans = useContext(PlanContext);
    const [episodes, setEpisodes] = useState([]);
    const { isLogin } = useContext(AuthContext);
    const navigate = useNavigate();
    const subscriptions = useSubscriptions() || [];
    const allRent = useRentMovies() || [];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    const movie = useMemo(() => {
        return movies.find(m => m.slug === slug || m.id === slug);
    }, [movies, slug]);

    const id = movie?.id;

    useEffect(() => {
        if (!id) return;
        const unsubscribe = fetchDataById("Episodes", "movieID", id, (data) => {
            setEpisodes(data);
        });
        return () => unsubscribe();
    }, [id]);


    useEffect(() => {
        if (!movie) return;
        const authorIds = [...new Set([movie.author, ...(movie.listAuthor || [])])].filter(id => id && !authorsMap[id]);

        if (authorIds.length > 0) {
            Promise.all(authorIds.map(id => getDocumentById("Authors", id).catch(() => null))).then(res => {
                const valid = res.filter(Boolean);
                if (valid.length) setAuthorsMap(prev => ({ ...prev, ...Object.fromEntries(valid.map(a => [a.id, a])) }));
            });
        }
    }, [movie]);

    useEffect(() => {
        if (!movie) return;
        const actorList = movie.actor || movie.actors || movie.listActor || [];
        const actorIds = [...new Set(actorList)].filter(id => typeof id === 'string' && !actorsMap[id]);

        if (actorIds.length > 0) {
            Promise.all(actorIds.map(id => getDocumentById("Actors", id).catch(() => null))).then(res => {
                const valid = res.filter(Boolean);
                if (valid.length) setActorsMap(prev => ({ ...prev, ...Object.fromEntries(valid.map(c => [c.id, c])) }));
            });
        }
    }, [movie]);

    useEffect(() => {
        if (!movie) return;
        const charList = movie.character || movie.characters || movie.listCharacter || [];
        const charIds = [...new Set(charList)].filter(id => typeof id === 'string' && !charactersMap[id]);

        if (charIds.length > 0) {
            Promise.all(charIds.map(id => getDocumentById("Characters", id).catch(() => null))).then(res => {
                const valid = res.filter(Boolean);
                if (valid.length) setCharactersMap(prev => ({ ...prev, ...Object.fromEntries(valid.map(c => [c.id, c])) }));
            });
        }
    }, [movie]);

    const levelUser = useMemo(() => {
        if (!plans || !movie) return false;
        const moviePlan = getObjectById(plans, movie.planID);
        const movieLevel = moviePlan?.level || 0;

        if (movieLevel === 0) return true;

        if (!isLogin || !subscriptions) return false;

        const userPlanLevel = getUserPlanInfo(isLogin, subscriptions, plans).level;
        return userPlanLevel >= movieLevel;
    }, [subscriptions, isLogin, plans, movie]);

    const checkRent = useMemo(() => {
        if (!isLogin) return false;
        const check = allRent.find(p => {
            return p.movieID == id && p.userID == isLogin.id && getExpiryDate(p) > new Date();
        });
        return check;
    }, [isLogin, allRent, id]);

    const checkShow = useMemo(() => {
        return levelUser || checkRent
    }, [levelUser, checkRent])

    const topMovies = movies?.slice(0, 10) || [];

    const realMovieId = movie?.id || id;

    const episodeShow = useMemo(() => {
        return episodes.filter(e => e.movieID == realMovieId).sort((a, b) => a.numberEpisode - b.numberEpisode)
    }, [realMovieId, episodes]);

    const movieActors = useMemo(() => {
        if (!movie) return [];
        let actorList = movie.actor || movie.actors || movie.listActor || [];
        if (Array.isArray(actorList) && actorList.length > 0) {
            const resolved = actorList.map(c => typeof c === 'string' ? getObjectById(actors, c) : c).filter(Boolean);
            if (resolved.length > 0) return resolved;
        }
        return [];
    }, [movie, actors]);

    const movieCharacters = useMemo(() => {
        if (!movie) return [];
        let charList = movie.character || movie.characters || movie.listCharacter || [];
        if (Array.isArray(charList) && charList.length > 0) {
            const resolved = charList.map(c => typeof c === 'string' ? getObjectById(characters, c) : c).filter(Boolean);
            if (resolved.length > 0) return resolved;
        }
        return [];
    }, [movie, characters]);

    const recommendedMovies = useMemo(() => {
        return movies?.filter(m => m.id !== realMovieId).slice(0, 8) || [];
    }, [movies, realMovieId]);

    const galleryImages = useMemo(() => {
        if (!movie) return [];
        const list = [
            movie.bannerUrl,
            movie.imgUrl,
            ...(Array.isArray(movie.gallery) ? movie.gallery : []),
            ...(Array.isArray(movie.images) ? movie.images : [])
        ].filter(Boolean);

        return Array.from(new Set(list));
    }, [movie]);

    const handleClickEpisodes = (ep) => {
        navigate(`/xem-phim/${movie?.slug || id}?tap=${ep.numberEpisode}`);
    }

    const isFavorite = useMemo(() => {
        if (!isLogin || !isLogin.listFavorite || !realMovieId) return false;
        return isLogin.listFavorite.includes(realMovieId);
    }, [isLogin, realMovieId]);

    const handleFavorite = async () => {
        if (!isLogin) {
            setLoginDialogState({
                open: true,
                title: "Vui lòng đăng nhập",
                description: "Bạn cần đăng nhập để thêm phim vào yêu thích"
            });
            return;
        }
        try {
            const currentFavorites = isLogin.listFavorite || [];
            let newFavorites;
            if (currentFavorites.includes(realMovieId)) {
                newFavorites = currentFavorites.filter(id => id !== realMovieId);
            } else {
                newFavorites = [...currentFavorites, realMovieId];
            }
            await updateDocument("Users", { id: isLogin.id, listFavorite: newFavorites });
        } catch (error) {
            console.error("Error updating favorites", error);
        }
    };

    const handleToggleList = async (listId) => {
        if (!isLogin) {
            setLoginDialogState({
                open: true,
                title: "Vui lòng đăng nhập",
                description: "Bạn cần đăng nhập để thêm phim"
            });
            return;
        }
        const currentLists = isLogin.listFilm || [];
        const updatedLists = currentLists.map(list => {
            if (list.id === listId) {
                const currentMovies = list.movies || [];
                if (currentMovies.includes(realMovieId)) {
                    return { ...list, movies: currentMovies.filter(id => id !== realMovieId) };
                } else {
                    return { ...list, movies: [...currentMovies, realMovieId] };
                }
            }
            return list;
        });

        try {
            await updateDocument("Users", { id: isLogin.id, listFilm: updatedLists });
        } catch (error) {
            console.error("Error updating lists", error);
        }
    };

    if (!movie) {
        return (
            <div className="bg-[#0f1322] min-h-screen text-slate-300 flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                    <p className="text-lg font-bold text-slate-400">Đang tải thông tin phim...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0f1322] min-h-screen text-slate-300 font-sans relative text-sm pb-20">
            <SEO 
                title={movie.otherName || movie.name}
                description={movie.description 
                    ? `Xem phim ${movie.otherName || movie.name} (${movie.name}) vietsub, thuyết minh chất lượng cao tại MFILM. ${movie.description.substring(0, 150)}...`
                    : `Xem phim ${movie.otherName || movie.name} (${movie.name}) vietsub, thuyết minh full HD tại MFILM.`
                }
                image={movie.bannerUrl || movie.imgUrl}
                url={`/phim/${slug}`}
                type="video.movie"
                extra={{
                    'video:release_date': movie.year || '',
                    'video:duration': movie.time || '',
                }}
            />

            {/* JSON-LD Structured Data for Google Rich Results */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Movie",
                "name": movie.otherName || movie.name,
                "alternateName": movie.name,
                "description": movie.description || `Xem phim ${movie.otherName || movie.name} tại MFILM`,
                "image": movie.bannerUrl || movie.imgUrl,
                "dateCreated": movie.year || undefined,
                "url": `https://mfilm.online/phim/${slug}`,
                ...(movie.time && { "duration": movie.time }),
                ...(movie.totalEpisodes && { "numberOfEpisodes": movie.totalEpisodes }),
                ...(movieActors.length > 0 && {
                    "actor": movieActors.slice(0, 5).map(a => ({
                        "@type": "Person",
                        "name": a.name
                    }))
                }),
                ...(authors.length > 0 && {
                    "director": authors.slice(0, 3).map(a => ({
                        "@type": "Person",
                        "name": a.name
                    }))
                }),
                "potentialAction": {
                    "@type": "WatchAction",
                    "target": `https://mfilm.online/xem-phim/${slug}`
                }
            }) }} />
            <div className="w-full h-112.5 md:h-137.5 lg:h-162.5 relative z-0">

                <img
                    src={movie.bannerUrl || movie.imgUrl}
                    alt="Banner"
                    className="w-full h-full object-cover object-top"
                />
            </div>

            <div className="relative z-10 w-full bg-[#0f1322] rounded-t-[40px] pt-8 lg:pt-12 -mt-20 lg:-mt-32">

                <div className="w-full max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

                    <div className="lg:col-span-3 flex flex-col gap-6">

                        <div className="rounded-xl overflow-hidden shadow-2xl w-2/3 sm:w-1/2 sm:h-3/4 lg:w-full mx-auto relative z-20 -mt-24 sm:-mt-70 lg:-mt-48 border-4 border-[#0f1322]">
                            <img
                                src={movie.imgUrl}
                                alt={movie.name}
                                className="w-full aspect-2/3 object-cover"
                            />
                        </div>

                        <div className="text-center lg:text-left mt-1">
                            <h1 className="text-xl md:text-2xl font-extrabold text-white mb-1 leading-tight">
                                {movie.otherName}
                            </h1>
                            <h2 className="text-xs md:text-sm text-yellow-500 font-medium">
                                {movie.name}
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-[10px] font-bold">
                            <p className="px-1.5 py-0.5 border border-yellow-500 text-yellow-500 rounded inline">{getObjectById(plans, movie.planID)?.name}</p>
                            <p className="px-1.5 py-0.5 bg-white text-black rounded inline">Vietsub</p>
                            <p className="px-1.5 py-0.5 border border-slate-600 text-slate-300 rounded inline">{movie.year || '2024'}</p>
                            <p className="px-1.5 py-0.5 border border-slate-600 text-slate-300 rounded inline">{movie.endEpisode || 0} Tập</p>
                        </div>

                        <div className="text-[13px] space-y-2 mt-2">
                            <div className="text-slate-400 leading-relaxed text-justify">
                                <span className="font-bold text-white block mb-1">Giới thiệu:</span>
                                {movie.description || 'Đang cập nhật nội dung giới thiệu cho bộ phim này...'}
                            </div>
                            <div className="text-slate-400"><span className="font-bold text-white inline">Thời lượng:</span> {movie.duration ? movie.duration + ' phút' : (movie.time || 'Đang cập nhật')}</div>
                            <div className="text-slate-400"><span className="font-bold text-white inline">Lượt xem:</span> {(Number(movie.views) || 0) + 100}</div>
                            <div className="text-slate-400"><span className="font-bold text-white inline">Quốc gia:</span> <span className="text-slate-300 hover:text-white cursor-pointer inline">{movie.countriesID}</span></div>
                            <div className="text-slate-400"><span className="font-bold text-white inline">Đạo diễn:</span> <span className="text-slate-300 hover:text-white cursor-pointer inline">{Array.isArray(movie.listAuthor) && movie.listAuthor.length > 0 ? movie.listAuthor.map(id => getObjectById(authors, id)?.name).filter(Boolean).join(', ') : (getObjectById(authors, movie.author)?.name || 'Đang cập nhật')}</span></div>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-base font-bold text-white mb-3">Nhân vật</h3>
                            <div className="flex flex-wrap gap-4">
                                {movieCharacters.map((character, idx) => {
                                    if (!character) return null;
                                    return (
                                        <div key={idx} className="relative flex flex-col items-center gap-1.5 w-14 cursor-pointer group">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-600 group-hover:border-yellow-400 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all duration-300 transform group-hover:scale-110 z-10">
                                                <img src={character.imgUrl || getDefaultAvatar(character.sexID)} alt={character.name} className="w-full h-full object-cover" onError={(e) => e.target.src = getDefaultAvatar(character.sexID)} />
                                            </div>
                                            <p className="text-[10px] text-center text-slate-300 truncate w-full transition-opacity duration-300">{character.name}</p>

                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:-translate-y-1 transition-all duration-300 z-50 pointer-events-none whitespace-nowrap">
                                                <div className="bg-[#0f1322]/90 backdrop-blur-md text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-yellow-500/30 shadow-[0_5px_20px_rgba(250,204,21,0.2)]">
                                                    {character.name}
                                                </div>
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-yellow-500/30"></div>
                                                <div className="absolute -bottom-0.75 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#0f1322]/90"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8 hidden lg:block">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                Top phim tuần này
                            </h3>
                            <div className="flex flex-col gap-4">
                                {topMovies.map((m, index) => (
                                    <div key={index} onClick={() => {
                                        navigate(`/phim/${m.slug || m.id}`);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }} className="flex items-center gap-3 group cursor-pointer">
                                        <div
                                            className={`text-3xl sm:text-4xl font-black italic w-10 shrink-0 text-center transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${index === 0
                                                ? "text-red-600"
                                                : index === 1
                                                    ? "text-orange-500"
                                                    : index === 2
                                                        ? "text-yellow-400"
                                                        : "text-pink-500"
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-700/60">
                                            <img src={m.imgUrl} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        </div>
                                        <div className="flex flex-col min-w-0 relative">
                                            <h4 className="text-[13px] font-bold text-slate-200 group-hover:text-yellow-400 transition-colors truncate">{m.name}</h4>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{m.year || 2024} • {m.endEpisode} Tập</p>

                                            <div className="absolute top-0 left-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-[-110%] transition-all duration-300 z-50 pointer-events-none whitespace-nowrap">
                                                <div className="bg-[#0f1322]/95 backdrop-blur-md text-yellow-400 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-yellow-500/30 shadow-[0_5px_20px_rgba(250,204,21,0.2)]">
                                                    {m.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="lg:col-span-9 flex flex-col gap-6">

                        <div className="bg-[#1a2035] rounded-3xl p-6 lg:p-8 flex flex-col gap-8 shadow-lg">

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-8">
                                    {checkShow ? <Link to={`/xem-phim/${movie?.slug || id}`} className="flex items-center gap-2 bg-[#facc15] hover:bg-yellow-500 text-black px-8 py-3 rounded-full font-bold transition-colors shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                        <FaPlay className="text-sm" /> Xem Ngay
                                    </Link> : <button onClick={() => {
                                        if (!isLogin) {
                                            setLoginDialogState({
                                                open: true,
                                                title: "Yêu cầu đăng nhập",
                                                description: "Bạn cần đăng nhập tài khoản để mua hoặc thuê phim này"
                                            });
                                            return;
                                        }
                                        navigate(`/pay/${realMovieId}`);
                                    }} className="flex items-center gap-2 bg-linear-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white px-6 py-3 rounded-full font-bold transition-all shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:-translate-y-0.5 cursor-pointer">
                                        <FaCrown className="text-sm" /> Mua phim
                                    </button>}
                                    <button onClick={handleFavorite} className={`flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${isFavorite ? 'text-red-500 hover:text-red-400' : 'text-slate-400 hover:text-white'}`}>
                                        <FaHeart className="text-xl" />
                                        <p className="text-[10px] font-bold uppercase inline">Yêu thích</p>
                                    </button>
                                    <div className="relative">
                                        <button onClick={() => setShowListDropdown(!showListDropdown)} className={`flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${showListDropdown ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                                            <FaPlus className="text-xl" />
                                            <p className="text-[10px] font-bold uppercase inline">Thêm vào</p>
                                        </button>

                                        {showListDropdown && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-[#1a2035]/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-slate-700/60 overflow-hidden z-50">
                                                <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700/60 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-white">Lưu vào danh sách</span>
                                                    <button onClick={() => setShowListDropdown(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
                                                </div>
                                                {(!isLogin?.listFilm || isLogin.listFilm.length === 0) ? (
                                                    <div className="p-4 text-xs text-slate-400 text-center">
                                                        Chưa có danh sách nào.<br />Vui lòng tạo tại trang Danh Sách.
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col max-h-48 overflow-y-auto custom-scrollbar p-2 gap-1">
                                                        {isLogin.listFilm.map(list => {
                                                            const inList = list.movies?.includes(realMovieId);
                                                            return (
                                                                <button key={list.id} onClick={() => handleToggleList(list.id)} className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-xl transition-colors text-left text-sm text-slate-200 group">
                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${inList ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500 group-hover:border-cyan-400'}`}>
                                                                        {inList && <div className="w-1.5 h-1.5 bg-[#1a2035] rounded-full"></div>}
                                                                    </div>
                                                                    <span className="truncate flex-1 font-medium">{list.name}</span>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                                        <FaShare className="text-xl" />
                                        <p className="text-[10px] font-bold uppercase inline">Chia sẻ</p>
                                    </button>
                                </div>
                                <button className="flex items-center gap-2 px-5 py-2 bg-blue-600/30 text-blue-400 rounded-full text-[13px] font-bold transition-colors hover:bg-blue-600/50 cursor-pointer">
                                    <FaStar /> 0 Đánh giá
                                </button>
                            </div>

                            <div className="flex items-center gap-6 md:gap-8 border-b border-slate-700/60 pb-1">
                                <button
                                    onClick={() => setActiveTab('episodes')}
                                    className={`relative pb-3 text-sm md:text-base font-bold transition-all duration-200 cursor-pointer ${activeTab === 'episodes'
                                        ? "text-yellow-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-yellow-400 after:rounded-full after:shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Tập phim
                                </button>

                                <button
                                    onClick={() => setActiveTab('gallery')}
                                    className={`relative pb-3 text-sm md:text-base font-bold transition-all duration-200 cursor-pointer ${activeTab === 'gallery'
                                        ? "text-yellow-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-yellow-400 after:rounded-full after:shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Gallery
                                </button>

                                <button
                                    onClick={() => setActiveTab('actors')}
                                    className={`relative pb-3 text-sm md:text-base font-bold transition-all duration-200 cursor-pointer ${activeTab === 'actors'
                                        ? "text-yellow-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-yellow-400 after:rounded-full after:shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Diễn viên
                                </button>

                                <button
                                    onClick={() => setActiveTab('recommend')}
                                    className={`relative pb-3 text-sm md:text-base font-bold transition-all duration-200 cursor-pointer ${activeTab === 'recommend'
                                        ? "text-yellow-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-yellow-400 after:rounded-full after:shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Đề xuất
                                </button>
                            </div>

                            {activeTab === 'episodes' && (
                                <ListEpisodes handleClickEpisodes={handleClickEpisodes} episodeShow={episodeShow} />
                            )}
                            {activeTab === 'gallery' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-2">
                                    {galleryImages.length > 0 ? (
                                        galleryImages.map((imgSrc, idx) => (
                                            <div
                                                key={idx}
                                                className="group relative rounded-2xl overflow-hidden aspect-video border-[3px] border-transparent shadow-md hover:border-[#facc15] hover:-translate-y-2 hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)] transition-all duration-300 cursor-pointer"
                                            >
                                                <img
                                                    src={imgSrc}
                                                    alt={`Gallery ${idx + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-[#131828]/60 rounded-2xl border border-slate-800/60">
                                            Chưa có hình ảnh trong bộ sưu tập.
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'actors' && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 py-4">
                                    {movieActors.length > 0 ? (
                                        movieActors.map((char, idx) => (
                                            <div key={idx} className="flex flex-col items-center gap-2 relative group cursor-pointer">
                                                <img
                                                    src={char.imgUrl || getDefaultAvatar(char.sexID)}
                                                    alt={char.name}
                                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-[3px] border-slate-700 group-hover:border-[#facc15] group-hover:shadow-[0_0_20px_rgba(250,204,21,0.5)] group-hover:-translate-y-2 transition-all duration-300"
                                                    onError={(e) => e.target.src = getDefaultAvatar(char.sexID)}
                                                />
                                                <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-[#facc15] transition-colors w-full truncate text-center mt-1">
                                                    {char.name}
                                                </p>
                                                {char.role && (
                                                    <p className="text-[10px] sm:text-xs text-slate-400 text-center truncate w-full">
                                                        {char.role}
                                                    </p>
                                                )}

                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 flex flex-col items-center">
                                                    <div className="bg-[#0f1322]/90 backdrop-blur-md text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-yellow-500/30 shadow-[0_5px_20px_rgba(250,204,21,0.2)] whitespace-nowrap">
                                                        {char.name}
                                                    </div>
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-yellow-500/30"></div>
                                                    <div className="absolute -bottom-0.75 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#0f1322]/90"></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-[#131828]/60 rounded-2xl border border-slate-800/60">
                                            Chưa có thông tin diễn viên cho bộ phim này.
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'recommend' && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 py-2">
                                    {recommendedMovies.map((m, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                navigate(`/phim/${m.slug || m.id}`);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="group cursor-pointer flex flex-col h-full"
                                        >
                                            <div className="relative w-full aspect-3/4 rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                                <img src={m.imgUrl} alt={m.name} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-40"></div>
                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                    <p className="bg-blue-600/90 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                                                       {m.endEpisode || 0} tập 
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="pt-2 pb-1 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                                                <h4 className="text-xs md:text-[13px] font-bold text-white group-hover:text-[#facc15] transition-colors truncate w-full">
                                                    {m.otherName || m.name}
                                                </h4>
                                                <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 group-hover:text-slate-200 transition-colors truncate w-full">
                                                    {m.name}
                                                </p>
                                                <div className="flex items-center justify-center gap-2 mt-1 w-full font-bold">
                                                    <div className="flex items-center text-white bg-linear-to-r from-blue-500 to-cyan-500 px-1.5 py-0.5 rounded-full shadow-md text-[8px] md:text-[9px] whitespace-nowrap">
                                                        {m.year || 2024}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-5 animate-fade-in mt-2">
                            <h3 className="text-xl font-bold text-white">Các bản chiếu</h3>

                            <div className="relative bg-[#3b415a] rounded-xl overflow-hidden w-full sm:w-80 shadow-lg">
                                <div className="absolute top-0 right-0 w-[80%] h-full z-0">
                                    <img
                                        src={movie.imgUrl || movie.bannerUrl}
                                        alt="bg"
                                        className="w-full h-full object-cover object-top opacity-50"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-r from-[#3b415a] via-[#3b415a]/80 to-transparent"></div>
                                </div>

                                <div className="relative z-10 p-5 flex flex-col gap-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-[#6366f1] rounded flex items-center justify-center p-1.5 shadow">
                                            <FaComment className="text-white text-[12px]" />
                                        </div>
                                        <p className="font-bold text-white text-[15px] inline">Vietsub #1</p>
                                    </div>

                                    <div className="mt-1 mb-1">
                                        <p className="font-black text-white text-xl inline">1</p>
                                    </div>

                                    <button className="bg-white hover:bg-slate-100 text-black px-4 py-2 mt-1 rounded-md font-bold text-[13px] w-fit shadow-md transition-colors">
                                        Xem bản này
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Comment isLogin={isLogin} onOpenLogin={() => window.dispatchEvent(new CustomEvent('openLoginModal'))} movieId={realMovieId} />

                    </div>
                </div>
            </div>
            <ModalDetail 
                open={loginDialogState.open} 
                handleClose={() => setLoginDialogState(prev => ({ ...prev, open: false }))} 
                title={loginDialogState.title}
                description={loginDialogState.description}
            />
        </div>
    );

}

export default DetailFilm;
