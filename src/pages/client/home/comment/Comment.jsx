import React, { useContext } from 'react';
import { FaHeart, FaBolt, FaMinus } from 'react-icons/fa';
import { FaArrowTrendUp } from 'react-icons/fa6';
import { BiSolidMoviePlay } from 'react-icons/bi';
import { MovieContext } from '../../../../contexts/MovieProvider';
import Coder from '../../../../assets/Coder.png';
function Comment() {
    const movies = useContext(MovieContext);
    return (
        <div className="w-full bg-[#0d0f14] py-8">
            <div className=" mx-auto px-4 sm:px-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-[#151720] border border-gray-800 rounded-xl overflow-hidden shadow-lg">

                    <div className="p-6 border-b md:border-b-0 md:border-r border-gray-800">
                        <div className="flex items-center gap-2 mb-6 text-[#facc15] font-bold text-[15px] tracking-wide">
                            <BiSolidMoviePlay className="text-lg" />
                            SÔI NỔI NHẤT
                        </div>

                        <div className="flex flex-col gap-5">
                            {movies.slice(0, 3).map((e, index) => (
                                <div key={e.id || index} className="flex items-center gap-3 group cursor-pointer">
                                    <span className="w-5 text-gray-500 font-bold text-sm shrink-0">{index + 1}</span>
                                    <FaArrowTrendUp className="w-4 text-green-500 text-sm shrink-0" />
                                    <img src={e.imgUrl} className="w-9 h-12 object-cover rounded shrink-0 border border-gray-800 group-hover:border-gray-600 transition-colors" />
                                    <h4 className="text-[13px] text-gray-200 line-clamp-2 leading-snug group-hover:text-yellow-400 transition-colors">
                                        {e.name}
                                    </h4>
                                </div>
                            ))}

                        </div>
                        <button className="mt-6 text-[13px] text-white transition-colors font-medium">Xem thêm</button>
                    </div>

                    <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-800">
                        <div className="flex items-center gap-2 mb-6 text-[#facc15] font-bold text-[15px] tracking-wide">
                            <FaHeart className="text-lg" />
                            YÊU THÍCH NHẤT
                        </div>

                        <div className="flex flex-col gap-5">
                            {movies.slice(0, 3).map((e, index) => (
                                <div key={e.id || index} className="flex items-center gap-3 group cursor-pointer">
                                    <span className="w-5 text-gray-500 font-bold text-sm shrink-0">{index + 1}</span>
                                    <FaMinus className="w-4 text-yellow-500 text-sm shrink-0" />                                    <img src={e.imgUrl} className="w-9 h-12 object-cover rounded shrink-0 border border-gray-800 group-hover:border-gray-600 transition-colors" />
                                    <h4 className="text-[13px] text-gray-200 line-clamp-2 leading-snug group-hover:text-yellow-400 transition-colors">
                                        {e.name}
                                    </h4>
                                </div>
                            ))}
                        </div>
                        <button className="mt-6 text-[13px] text-white transition-colors font-medium">Xem thêm</button>
                    </div>

                    <div className="p-6 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-6 text-[#facc15] font-bold text-[15px] tracking-wide">
                            <FaBolt className="text-lg" />
                            BÌNH LUẬN MỚI
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="flex gap-3 group cursor-pointer">
                                <img src={Coder} className="w-10 h-10 rounded-full shrink-0 border border-gray-700 object-cover" />
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">Hoài Nam</span>
                                        <span className="text-[11px] text-gray-500">1 giờ trước</span>
                                    </div>
                                    <p className="text-[13px] text-gray-400 line-clamp-2 leading-snug">Phim hay xuất sắc</p>
                                    <span className="text-[11px] text-yellow-500/80 line-clamp-1 mt-0.5">» Demon Slayer: Kimetsu no Yaiba</span>
                                </div>
                            </div>
                            <div className="flex gap-3 group cursor-pointer">
                                <img src={Coder} className="w-10 h-10 rounded-full shrink-0 border border-gray-700 object-cover" />
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">Hoài Nam</span>
                                        <span className="text-[11px] text-gray-500">1 giờ trước</span>
                                    </div>
                                    <p className="text-[13px] text-gray-400 line-clamp-2 leading-snug">Phim hay xuất sắc</p>
                                    <span className="text-[11px] text-yellow-500/80 line-clamp-1 mt-0.5">» Demon Slayer: Kimetsu no Yaiba</span>
                                </div>
                            </div>
                            <button className="mt-6 text-[13px] text-white flex justify-start transition-colors font-medium">Xem thêm</button>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Comment;
