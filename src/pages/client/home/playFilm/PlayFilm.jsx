import React, { useContext, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlay, FaVolumeUp, FaExpand, FaEllipsisV, FaComments, FaPaperPlane, FaClosedCaptioning, FaMicrophone, FaBell } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { getObjectById } from '../../../../services/firebaseReponse';
import { PlanContext } from '../../../../contexts/PlanProvider';

export default function PlayFilm({ handleOpenLogin }) {
    const [activeAudio, setActiveAudio] = useState('vietsub');
    const [activeEpisode, setActiveEpisode] = useState(1);
    const movies = useContext(MovieContext);
    const plans = useContext(PlanContext);
    return (
        <div className="min-h-screen bg-[#0d0f14] text-gray-300 font-sans pb-10">
            <div className=" mx-auto px-4 sm:px-6 pt-4">

                <div className="flex items-center gap-3 mb-6">
                    <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-600 hover:border-yellow-400 hover:text-yellow-400 transition-all">
                        <FaChevronLeft className="pr-0.5" />
                    </button>
                    <h1 className="text-lg sm:text-xl font-bold text-white">Xem phim Tình Yêu Có Pháo Hoa</h1>
                </div>

                <div className="w-full mb-8">
                    <div className="relative w-full md:w-[80%] m-auto aspect-video bg-black rounded-lg overflow-hidden flex flex-col justify-between group">
                        <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-yellow-400 flex items-center justify-center bg-black/50 hover:scale-110 transition-transform">
                                <FaPlay className="text-yellow-400 text-2xl sm:text-3xl ml-1.5" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start border-b border-gray-800 pb-6">
                            <div className="md:w-1/3">
                                <h1 className="text-2xl font-bold text-white">Tình Yêu Có Pháo Hoa</h1>
                                <p className="text-yellow-500 text-sm mt-1">Love Has Fireworks (2026)</p>
                            </div>
                            <div className="md:w-2/3 text-sm text-gray-400 leading-relaxed">
                                <p>Tình Yêu Có Pháo Hoa là bộ phim tình cảm đô thị xoay quanh Lý Diệc Phi, một chuyên gia ngân hàng đầu tư sơ cơ sau thất bại trong công việc, và Tiền Phi, cô gái đang chật vật đối mặt với cú sốc thất tình lẫn thất nghiệp. Tình cờ trở thành bạn cùng nhà để giảm bớt gánh nặng tài chính, cả hai liên tục va chạm vì khác biệt về tính cách, hoàn cảnh và quan điểm...</p>
                                <button className="text-yellow-500 mt-2 font-medium hover:underline">Thông tin phim &gt;</button>
                            </div>
                        </div>

                        <div className="mt-6 bg-linear-to-r from-[#4b6cb7] via-[#7b2ff7] to-[#b83280] rounded-lg p-5 flex gap-4 items-start shadow-lg">
                            <div className="mt-1 shrink-0 text-yellow-400">
                                <FaBell className="text-xl" />
                            </div>
                            <div className="text-sm text-white space-y-1 font-medium">
                                <p>Click chọn SV 1, SV 2 hoặc SV 3 nếu không xem được.</p>
                                <p>Tham gia <a href="" className="text-yellow-300 hover:underline">nhóm Game Telegram</a></p>
                                <p>Mời bạn tham gia <a href="#" className="text-yellow-300 hover:underline">nhóm discord của RoPhim</a></p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={() => setActiveAudio('vietsub')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors border ${activeAudio === 'vietsub'
                                    ? 'bg-[#facc15]/20 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                                    : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800'
                                    }`}
                            >
                                <FaClosedCaptioning /> Vietsub
                            </button>
                            <button
                                onClick={() => setActiveAudio('thuyetminh')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors border ${activeAudio === 'thuyetminh'
                                    ? 'bg-[#facc15]/20 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                                    : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800'
                                    }`}
                            >
                                <FaMicrophone /> Thuyết Minh
                            </button>
                        </div>

                        <div className="mt-6 flex justify-center gap-3">
                            <button className="px-6 py-2 rounded-md bg-yellow-400 text-black text-sm font-bold shadow-md hover:bg-yellow-500 transition-colors">SVR 1</button>
                            <button className="px-6 py-2 rounded-md bg-[#b83280] text-white text-sm font-bold shadow-md hover:bg-[#9d2b6d] transition-colors">SVR 2</button>
                            <button className="px-6 py-2 rounded-md bg-[#25855A] text-white text-sm font-bold shadow-md hover:bg-[#1f6e4a] transition-colors">SVR 3</button>
                        </div>

                        <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            <button className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-colors border bg-yellow-400 border-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                                <FaPlay className="text-[10px]" /> Tập 1
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 2
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 3
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 4
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 5
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 6
                            </button>
                        </div>

                        <div className="mt-12">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                                <FaComments className="text-gray-400" /> Bình luận
                            </h2>
                            <p className="text-sm text-gray-400 mb-4">
                                Vui lòng <button onClick={handleOpenLogin} className="text-yellow-500 hover:underline font-medium">đăng nhập</button> để tham gia bình luận.
                            </p>

                            <div className="bg-[#161821] rounded-lg p-3 border border-gray-800 focus-within:border-gray-600 transition-colors">
                                <textarea
                                    rows="4"
                                    placeholder="Viết bình luận"
                                    className="w-full bg-transparent text-sm text-white outline-none resize-none placeholder-gray-600"
                                ></textarea>
                                <div className="flex justify-between items-center mt-2 border-t border-gray-800 pt-2">
                                    <span className="text-xs text-gray-600">0 / 1000</span>
                                    <button className="flex items-center gap-2 text-sm text-yellow-500 font-medium hover:text-yellow-400">
                                        Gửi <FaPaperPlane />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-[320px] xl:w-90 shrink-0">
                        <h2 className="text-xl font-bold text-white mb-6">Đề xuất cho bạn</h2>

                        <div className="flex flex-col gap-4">
                            {movies.slice(0,5).map((e) => (
                                <div className="flex gap-4 bg-transparent p-2 rounded-lg hover:bg-[#161821] transition-colors cursor-pointer group">
                                    <div className="w-18 h-26.25 shrink-0 overflow-hidden rounded-md border border-gray-800 group-hover:border-gray-600">
                                        <img src={e.imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="flex flex-col justify-center py-1">
                                        <h3 className="text-[15px] font-bold text-gray-200 line-clamp-2 group-hover:text-yellow-400 transition-colors leading-snug">{e.name}</h3>
                                        <p className="text-xs text-amber-300 line-clamp-1 mt-1">
                                            {getObjectById(plans, e.planID)?.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[11px] text-gray-400">{e.countriesID}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                            <span className="text-[11px] text-gray-400">{e.duration} phút</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}