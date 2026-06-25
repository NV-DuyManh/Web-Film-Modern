import React from 'react';
import { FaChevronLeft, FaChevronRight, FaPlay, FaVolumeUp, FaExpand, FaEllipsisV, FaComments, FaPaperPlane, FaClosedCaptioning, FaMicrophone } from 'react-icons/fa';

export default function PlayFilm() {
    return (
        <div className="min-h-screen bg-[#0d0f14] text-gray-300 font-sans pb-10">
            <div className="max-w-350 mx-auto px-4 sm:px-6 pt-4">

                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-4">
                    <span className="hover:text-yellow-400 cursor-pointer transition-colors">RoPhim</span>
                    <FaChevronRight className="text-[10px]" />
                    <span className="hover:text-yellow-400 cursor-pointer transition-colors">Chủ Đề Phim Bộ</span>
                    <FaChevronRight className="text-[10px]" />
                    <span className="hover:text-yellow-400 cursor-pointer transition-colors">Thông Tin Phim</span>
                    <FaChevronRight className="text-[10px]" />
                    <span className="text-gray-300">Kẻ Thù Hoàng Gia Của Tôi - Tập 1</span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-600 hover:border-yellow-400 hover:text-yellow-400 transition-all">
                        <FaChevronLeft className="pr-0.5" />
                    </button>
                    <h1 className="text-lg sm:text-xl font-bold text-white">Xem phim Kẻ Thù Hoàng Gia Của Tôi</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

                    <div className="flex-1 w-full overflow-hidden">

                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex flex-col justify-between group">
                            <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-yellow-400 flex items-center justify-center bg-black/50 hover:scale-110 transition-transform">
                                    <FaPlay className="text-yellow-400 text-2xl sm:text-3xl ml-1.5" />
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/90 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-4">
                                    <button><FaPlay className="text-white hover:text-yellow-400" /></button>
                                    <span className="text-xs sm:text-sm font-medium">0:00 / 1:10:59</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button><FaVolumeUp className="text-white hover:text-yellow-400" /></button>
                                    <button><FaExpand className="text-white hover:text-yellow-400" /></button>
                                    <button><FaEllipsisV className="text-white hover:text-yellow-400" /></button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-start border-b border-gray-800 pb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Kẻ Thù Hoàng Gia Của Tôi</h1>
                                <p className="text-yellow-500 text-sm mt-1">My Royal Nemesis (2026)</p>
                            </div>
                            <div className="sm:w-1/2 text-sm text-gray-400 leading-relaxed">
                                <p>Một ác nữ thời Joseon bị ban chết bỗng tỉnh dậy ở Seoul thời hiện đại. Tại đó, một người thừa kế tập đoàn tài phiệt tàn nhẫn có thể là cơ hội cuối để cô thay đổi số phận của mình.</p>
                                <button className="text-yellow-500 mt-2 font-medium hover:underline">Thông tin phim &gt;</button>
                            </div>
                        </div>

                        <div className="mt-6 bg-linear-to-r from-[#4b6cb7] to-[#182848] rounded-lg p-4 flex gap-3 items-start shadow-lg">
                            <div className="mt-1 shrink-0 text-yellow-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <div className="text-sm text-white space-y-1 font-medium">
                                <p>Click chọn SVR 1, SVR 2 hoặc SVR 3 Nếu không xem được.</p>
                                <p>Tham gia <a href="#" className="text-yellow-300 hover:underline">nhóm Game Telegram</a></p>
                                <p>Mời bạn tham gia <a href="#" className="text-yellow-300 hover:underline">nhóm discord của RoPhim</a></p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#facc15]/20 border border-yellow-400 text-yellow-400 text-sm font-medium hover:bg-yellow-400 hover:text-black transition-colors">
                                <FaClosedCaptioning /> Vietsub
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-transparent border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors">
                                <FaMicrophone /> Thuyết Minh
                            </button>
                        </div>

                        <div className="mt-6 flex justify-center gap-2">
                            <button className="px-4 py-1.5 rounded-md bg-yellow-400 text-black text-sm font-bold shadow-md hover:bg-yellow-500 transition-colors">SVR 1</button>
                            <button className="px-4 py-1.5 rounded-md bg-[#b83280] text-white text-sm font-bold shadow-md hover:bg-[#9d2b6d] transition-colors">SVR 2</button>
                            <button className="px-4 py-1.5 rounded-md bg-[#25855A] text-white text-sm font-bold shadow-md hover:bg-[#1f6e4a] transition-colors">SVR 3</button>
                        </div>

                        <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors border bg-yellow-400 border-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                                <FaPlay className="text-[10px]" /> Tập 1
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 2
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 3
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 4
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 5
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 6
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 7
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 8
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 9
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors border bg-[#1a1c24] border-gray-700 text-gray-300 hover:bg-[#2a2d3a] hover:border-gray-500">
                                <FaPlay className="text-[10px]" /> Tập 10
                            </button>
                        </div>

                        <div className="mt-12">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                                <FaComments className="text-gray-400" /> Bình luận
                            </h2>
                            <p className="text-sm text-gray-400 mb-4">
                                Vui lòng <a href="#" className="text-yellow-500 hover:underline">đăng nhập</a> để tham gia bình luận.
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

                    <div className="w-full lg:w-[320px] xl:w-87.5 shrink-0">
                        <h2 className="text-xl font-bold text-white mb-4">Đề xuất cho bạn</h2>

                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3 bg-[#161821] p-2.5 rounded-lg hover:bg-[#1f2233] transition-colors cursor-pointer border border-transparent hover:border-gray-700 group">
                                <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 overflow-hidden rounded-md">
                                    <img
                                        src="https://via.placeholder.com/60x90/1a1c29/ffffff?text=Agon"
                                        alt="Agon"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex flex-col justify-center py-1">
                                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">Agon</h3>
                                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">Agon (2025)</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] text-gray-400">2025</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        <span className="text-[10px] text-gray-400">FHD VS</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 bg-[#161821] p-2.5 rounded-lg hover:bg-[#1f2233] transition-colors cursor-pointer border border-transparent hover:border-gray-700 group">
                                <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 overflow-hidden rounded-md">
                                    <img
                                        src="https://via.placeholder.com/60x90/1a1c29/ffffff?text=Ma"
                                        alt="Chuyện Ma Giảng Đường"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex flex-col justify-center py-1">
                                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">Chuyện Ma Giảng Đường – Năm 3</h3>
                                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">Haunted Universities 3 (2024)</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] text-gray-400">2024</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        <span className="text-[10px] text-gray-400">HD VS</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 bg-[#161821] p-2.5 rounded-lg hover:bg-[#1f2233] transition-colors cursor-pointer border border-transparent hover:border-gray-700 group">
                                <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 overflow-hidden rounded-md">
                                    <img
                                        src="https://via.placeholder.com/60x90/1a1c29/ffffff?text=Kill+Blue"
                                        alt="Kill Blue"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex flex-col justify-center py-1">
                                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">Kill Blue</h3>
                                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">KILL BLUE (2026)</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] text-gray-400">2026</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        <span className="text-[10px] text-gray-400">Tập 11 VS</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 bg-[#161821] p-2.5 rounded-lg hover:bg-[#1f2233] transition-colors cursor-pointer border border-transparent hover:border-gray-700 group">
                                <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 overflow-hidden rounded-md">
                                    <img
                                        src="https://via.placeholder.com/60x90/1a1c29/ffffff?text=Mothman"
                                        alt="Lời Nguyền Đáng Sợ"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex flex-col justify-center py-1">
                                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">Lời Nguyền Đáng Sợ</h3>
                                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">The Mothman Prophecies (2002)</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] text-gray-400">2002</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        <span className="text-[10px] text-gray-400">FHD VS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}