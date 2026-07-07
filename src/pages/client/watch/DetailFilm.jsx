import React, { useContext } from 'react';
import { FaPlay, FaHeart, FaPlus, FaShare, FaComment, FaStar, FaPaperPlane } from 'react-icons/fa';
import { MovieContext } from '../../../contexts/MovieProvider';
import { AuthorContext } from '../../../contexts/AuthorProvider';
import { CharacterContext } from '../../../contexts/CharacterProvider';
import { getObjectById } from '../../../services/firebaseReponse';
import { PlanContext } from '../../../contexts/PlanProvider';

export default function DetailFilm() {

    const movies = useContext(MovieContext);
    const authors = useContext(AuthorContext);
    const characters = useContext(CharacterContext);
    const plans = useContext(PlanContext);
    const movie = movies.length > 0 ? movies[0] : null;
    
    const topMovies = movies.slice(0, 10);

    if (!movie) {
        return <div className="bg-[#0f1322] min-h-screen flex items-center justify-center text-white">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="bg-[#0f1322] min-h-screen text-slate-300 font-sans relative text-sm pb-20">
            
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
                        
                        <div className="rounded-xl overflow-hidden shadow-2xl w-2/3 sm:w-1/2 lg:w-full mx-auto relative z-20 -mt-24 lg:-mt-48 border-4 border-[#0f1322]">
                            <img 
                                src={movie.imgUrl} 
                                alt={movie.name} 
                                className="w-full aspect-2/3 object-cover"
                            />
                        </div>

                        <div className="text-center lg:text-left mt-1">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 leading-tight">
                                {movie.name}
                            </h1>
                            <h2 className="text-sm text-yellow-500 font-medium">
                                {movie.originName || movie.name}
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-[10px] font-bold">
                            <span className="px-1.5 py-0.5 border border-yellow-500 text-yellow-500 rounded">{getObjectById (plans, movie.planID)?.name}</span>
                            <span className="px-1.5 py-0.5 bg-white text-black rounded">Vietsub</span>
                            <span className="px-1.5 py-0.5 border border-slate-600 text-slate-300 rounded">{movie.year || '2024'}</span>
                            <span className="px-1.5 py-0.5 border border-slate-600 text-slate-300 rounded">{movie.endEpisode || 0} Tập</span>
                        </div>

                        <div className="text-[13px] space-y-2 mt-2">
                            <p className="text-slate-400 leading-relaxed text-justify">
                                <span className="font-bold text-white block mb-1">Giới thiệu:</span> 
                                {movie.description || 'Đang cập nhật nội dung giới thiệu cho bộ phim này...'}
                            </p>
                            <p className="text-slate-400"><span className="font-bold text-white">Thời lượng:</span> {movie.time || 'Đang cập nhật'}</p>
                            <p className="text-slate-400"><span className="font-bold text-white">Quốc gia:</span> <span className="text-slate-300 hover:text-white cursor-pointer">{movie.countriesID}</span></p>
                            <p className="text-slate-400"><span className="font-bold text-white">Đạo diễn:</span> <span className="text-slate-300 hover:text-white cursor-pointer">{movie.list_Author?.length > 0 ? movie.list_Author.map(id => getObjectById(authors, id)?.name).filter(Boolean).join(', ') : (getObjectById(authors, movie.author)?.name || 'Đang cập nhật')}</span></p>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-base font-bold text-white mb-3">Diễn viên</h3>
                            <div className="flex flex-wrap gap-4">
                                {(movie.character || movie.characters || characters.slice(0, 3)).map((charIdOrObj, idx) => {
                                    const character = typeof charIdOrObj === 'string' ? getObjectById(characters, charIdOrObj) : charIdOrObj;
                                    if (!character) return null;
                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-1.5 w-14 cursor-pointer group">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-600 group-hover:border-white transition-colors">
                                                <img src={character.imgUrl || character.img || 'https://via.placeholder.com/150'} alt={character.name} className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-[10px] text-center text-slate-300 truncate w-full group-hover:text-white">{character.name}</p>
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
                                    <div key={index} className="flex items-center gap-3 group cursor-pointer">
                                        <div 
                                            className="text-4xl font-black italic w-6 text-center text-transparent"
                                            style={{ WebkitTextStroke: '1px #475569', color: index < 3 ? 'transparent' : 'transparent' }}
                                        >
                                            <span className={index === 0 ? "text-yellow-500 stroke-none" : index === 1 ? "text-slate-300 stroke-none" : index === 2 ? "text-amber-600 stroke-none" : ""}>
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div className="w-10 h-14 rounded overflow-hidden shrink-0">
                                            <img src={m.imgUrl} alt={m.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h4 className="text-[13px] font-bold text-slate-200 group-hover:text-yellow-400 transition-colors truncate">{m.name}</h4>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{m.year || 2024} • {m.endEpisode} Tập</p>
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
                                    <button className="flex items-center gap-2 bg-[#facc15] hover:bg-yellow-500 text-black px-8 py-3 rounded-full font-bold transition-colors shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                        <FaPlay className="text-sm" /> Xem Ngay
                                    </button>
                                    
                                    <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                                        <FaHeart className="text-xl" />
                                        <span className="text-[10px] font-bold uppercase">Yêu thích</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                                        <FaPlus className="text-xl" />
                                        <span className="text-[10px] font-bold uppercase">Thêm vào</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                                        <FaShare className="text-xl" />
                                        <span className="text-[10px] font-bold uppercase">Chia sẻ</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                                        <FaComment className="text-xl" />
                                        <span className="text-[10px] font-bold uppercase">Bình luận</span>
                                    </button>
                                </div>
                                <button className="flex items-center gap-2 px-5 py-2 bg-blue-600/30 text-blue-400 rounded-full text-[13px] font-bold transition-colors hover:bg-blue-600/50">
                                    <FaStar /> 0 Đánh giá
                                </button>
                            </div>

                            <div className="flex gap-8 border-b border-slate-700/50 overflow-x-auto scrollbar-hide -mb-2">
                                {['Tập phim', 'Gallery', 'Diễn viên', 'Đề xuất'].map((tab, i) => {
                                    return (
                                        <div 
                                            key={i}
                                            className={`pb-3 text-[15px] font-bold whitespace-nowrap ${i === 0 ? 'text-yellow-400 border-b-[3px] border-yellow-400' : 'text-slate-400'}`}
                                        >
                                            {tab}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-5 animate-fade-in mt-2">
                            <h3 className="text-xl font-bold text-white">Các bản chiếu</h3>
                            
                            <div className="relative bg-[#3b415a] rounded-xl overflow-hidden w-full sm:w-[320px] shadow-lg">
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
                                        <span className="font-bold text-white text-[15px]">Vietsub #1</span>
                                    </div>
                                    
                                    <div className="mt-1 mb-1">
                                        <span className="font-black text-white text-xl">1</span>
                                    </div>

                                    <button className="bg-white hover:bg-slate-100 text-black px-4 py-2 mt-1 rounded-md font-bold text-[13px] w-fit shadow-md transition-colors">
                                        Xem bản này
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-4 animate-fade-in">
                            <div className="flex items-center gap-2 text-white">
                                <FaComment className="text-xl" />
                                <h3 className="text-xl font-bold">Bình luận (0)</h3>
                            </div>
                            
                            <p className="text-sm text-slate-400">
                                Vui lòng <span className="text-yellow-500 cursor-pointer hover:underline">đăng nhập</span> để tham gia bình luận.
                            </p>
                            
                            <div className="bg-[#212738] border border-slate-700/50 rounded-xl p-3 flex flex-col gap-3 mt-3 shadow-lg">
                                <div className="bg-[#131722] rounded-lg relative overflow-hidden">
                                    <textarea 
                                        placeholder="Viết bình luận" 
                                        className="w-full bg-transparent p-4 text-slate-300 resize-none outline-none min-h-25 text-[13px] placeholder-slate-600"
                                        maxLength="1000"
                                    ></textarea>
                                    <span className="absolute top-4 right-4 text-[11px] text-slate-500 font-medium">0 / 1000</span>
                                </div>
                                
                                <div className="px-1 flex justify-between items-center pb-1">
                                    <div className="flex items-center gap-2.5 cursor-pointer group">
                                        <div className="w-8 h-4 rounded-full border border-slate-500 relative flex items-center px-0.75 transition-colors group-hover:border-slate-400">
                                            <div className="w-2 h-2 bg-slate-500 rounded-full group-hover:bg-slate-400 transition-colors"></div>
                                        </div>
                                        <span className="text-[12px] font-bold text-slate-300">Tiết lộ?</span>
                                    </div>

                                    <button className="flex items-center gap-2 text-[#facc15] hover:text-yellow-400 font-bold text-[13px] transition-colors group">
                                        Gửi <FaPaperPlane className="text-sm group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center py-20 bg-[#151a2d] rounded-xl mt-4 text-slate-500 shadow-inner">
                                <FaComment className="text-5xl mb-4 opacity-40" />
                                <p className="text-[14px]">Chưa có bình luận nào</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}