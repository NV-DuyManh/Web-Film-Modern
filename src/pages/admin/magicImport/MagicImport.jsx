import React, { useState, useContext } from 'react';
import { FaMagic, FaCloudUploadAlt, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { parseTSV, mapMovieData } from '../../../utils/MagicParser';
import { db } from '../../../config/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

// Import TOÀN BỘ các Context liên quan để map ID
import { CategoriesContext } from '../../../contexts/CategoryProvider';
import { AuthorContext } from '../../../contexts/AuthorProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { CategoryTypeContext } from '../../../contexts/CategoryTypeProvider';
import { ActorContext } from '../../../contexts/ActorProvider';
import { CharacterContext } from '../../../contexts/CharacterProvider';

import LOGO from "../../../assets/Logo.png";

function MagicImport() {
    const [inputText, setInputText] = useState("");
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Lấy dữ liệu từ TẤT CẢ Context
    const categories = useContext(CategoriesContext) || [];
    const authors = useContext(AuthorContext) || [];
    const plans = useContext(PlanContext) || [];
    const categoryTypes = useContext(CategoryTypeContext) || [];
    const actors = useContext(ActorContext) || [];
    const characters = useContext(CharacterContext) || [];

    // Xử lý nút Nhận diện
    const handleParse = () => {
        setSuccessMsg("");
        const rawData = parseTSV(inputText);
        if (rawData.length === 0) {
            alert("Không tìm thấy dữ liệu hợp lệ. Vui lòng copy bảng chứa Header!");
            return;
        }
        const mappedData = mapMovieData(rawData);
        setPreviewData(mappedData);
    };

    // Xử lý nút Import FULL Trường
    const handleExecuteImport = async () => {
        if (previewData.length === 0) return;
        setLoading(true);

        // Tạo mảng tạm cục bộ để cache dữ liệu, tránh tạo trùng lặp trong cùng 1 lần import
        let localCategories = [...categories];
        let localAuthors = [...authors];
        let localActors = [...actors];
        let localCharacters = [...characters];
        let localCategoryTypes = [...categoryTypes];

        const defaultPlanID = plans.length > 0 ? plans[0].id : "";

        try {
            for (const movie of previewData) {
                let list_Category = [];
                let list_Actor = [];
                let list_Character = [];
                let authorID = "";
                let category_Type_Id = "";

                // 1. Xử lý Thể Loại (Categories)
                if (movie.rawCategories) {
                    const catNames = movie.rawCategories.split(',').map(c => c.trim());
                    for (const cName of catNames) {
                        const existCat = localCategories.find(c => c.name.toLowerCase() === cName.toLowerCase());
                        if (existCat) {
                            list_Category.push(existCat.id);
                        } else {
                            const docRef = await addDoc(collection(db, "Categories"), { name: cName, description: "Auto Gen" });
                            list_Category.push(docRef.id);
                            localCategories.push({ id: docRef.id, name: cName });
                        }
                    }
                }

                // 2. Xử lý Loại Phim (CategoryType - VD: Phim Lẻ, Phim Bộ, Anime...)
                if (movie.rawCategoryType) {
                    const existCatType = localCategoryTypes.find(c => c.name.toLowerCase() === movie.rawCategoryType.toLowerCase());
                    if (existCatType) {
                        category_Type_Id = existCatType.id;
                    } else {
                        const docRef = await addDoc(collection(db, "CategoryType"), { name: movie.rawCategoryType, description: "Auto Gen" });
                        category_Type_Id = docRef.id;
                        localCategoryTypes.push({ id: docRef.id, name: movie.rawCategoryType });
                    }
                } else {
                    category_Type_Id = localCategoryTypes.length > 0 ? localCategoryTypes[0].id : "";
                }

                // 3. Xử lý Đạo diễn (Authors)
                if (movie.rawAuthor) {
                    const existAuthor = localAuthors.find(a => a.name.toLowerCase() === movie.rawAuthor.toLowerCase());
                    if (existAuthor) {
                        authorID = existAuthor.id;
                    } else {
                        const docRef = await addDoc(collection(db, "Authors"), { name: movie.rawAuthor, imgUrl: LOGO, description: "Auto Gen", sexID: "Other", countriesID: movie.countriesID });
                        authorID = docRef.id;
                        localAuthors.push({ id: docRef.id, name: movie.rawAuthor });
                    }
                }

                // 4. Xử lý Diễn viên (Actors)
                if (movie.rawActors) {
                    const actorNames = movie.rawActors.split(',').map(a => a.trim());
                    for (const aName of actorNames) {
                        const existActor = localActors.find(a => a.name.toLowerCase() === aName.toLowerCase());
                        if (existActor) {
                            list_Actor.push(existActor.id);
                        } else {
                            const docRef = await addDoc(collection(db, "Actors"), { name: aName, imgUrl: LOGO, description: "Auto Gen", sexID: "Other", countriesID: movie.countriesID });
                            list_Actor.push(docRef.id);
                            localActors.push({ id: docRef.id, name: aName });
                        }
                    }
                }

                // 5. Xử lý Nhân vật (Characters)
                if (movie.rawCharacters) {
                    const charNames = movie.rawCharacters.split(',').map(c => c.trim());
                    for (const cName of charNames) {
                        const existChar = localCharacters.find(c => c.name.toLowerCase() === cName.toLowerCase());
                        if (existChar) {
                            list_Character.push(existChar.id);
                        } else {
                            const docRef = await addDoc(collection(db, "Characters"), { name: cName, imgUrl: LOGO, description: "Auto Gen" });
                            list_Character.push(docRef.id);
                            localCharacters.push({ id: docRef.id, name: cName });
                        }
                    }
                }

                // 6. Gắn kết TOÀN BỘ dữ liệu vào Object Phim
                const submitMovie = {
                    name: movie.name,
                    otherName: movie.otherName,
                    description: movie.description,
                    imgUrl: LOGO,
                    bannerUrl: LOGO,
                    releaseYear: movie.releaseYear,
                    duration: movie.duration,
                    endEpisode: movie.endEpisode,
                    ageRating: movie.ageRating,
                    status: movie.status,
                    hasSub: movie.hasSub,
                    hasDub: movie.hasDub,
                    hasVoice: movie.hasVoice,
                    episodeSub: movie.episodeSub,
                    episodeDub: movie.episodeDub,
                    episodeVoice: movie.episodeVoice,
                    rent: movie.rent,
                    countriesID: movie.countriesID,
                    planID: defaultPlanID,
                    category_Type_Id: category_Type_Id,
                    list_Category: list_Category,
                    author: authorID,
                    list_Actor: list_Actor,
                    list_Character: list_Character,
                    showtimes: movie.rawShowtimes || "", // Nếu có bảng ShowTime riêng, sau này có thể tách ra tương tự
                    createdAt: new Date().toISOString()
                };

                // Lưu lên Firebase
                await addDoc(collection(db, "Movies"), submitMovie);
            }

            setSuccessMsg(`Đã import FULL thành công ${previewData.length} bộ phim và các thực thể liên quan!`);
            setPreviewData([]);
            setInputText("");
        } catch (error) {
            console.error("Lỗi khi import:", error);
            alert("Có lỗi xảy ra, vui lòng kiểm tra F12 Console!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='p-6 min-h-screen text-white'>
            <div className='flex items-center gap-4 mb-8 bg-slate-800/40 p-5 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]'>
                <div className='w-14 h-14 rounded-xl bg-linear-to-br from-cyan-400 to-purple-500 flex justify-center items-center shadow-[0_0_15px_rgba(34,211,238,0.5)]'>
                    <FaMagic className='text-3xl text-white' />
                </div>
                <div>
                    <h1 className='text-3xl font-black tracking-wide glow-text uppercase'>Magic Import</h1>
                    <p className='text-gray-400 text-sm mt-1'>Copy bảng từ Excel/ChatGPT và Paste vào đây để tự động phân tích full dữ liệu.</p>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
                {/* Khu vực Nhập liệu */}
                <div className='col-span-1 lg:col-span-4 flex flex-col gap-4'>
                    <div className='bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl relative group transition-all hover:border-cyan-500/50'>
                        <h2 className='text-cyan-400 font-bold mb-3 uppercase tracking-wider text-sm flex items-center gap-2'>
                            <FaCloudUploadAlt className="text-xl" /> Khu vực Paste Dữ Liệu
                        </h2>
                        <textarea
                            className='w-full h-100 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-gray-300 font-mono focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] custom-scrollbar'
                            placeholder='Paste bảng dữ liệu vào đây...'
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button 
                            onClick={handleParse}
                            className='w-full mt-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] active:scale-95'
                        >
                            Nhận Diện Dữ Liệu
                        </button>
                    </div>
                </div>

                {/* Khu vực Preview FULL TRƯỜNG */}
                <div className='col-span-1 lg:col-span-8 flex flex-col gap-4'>
                    <div className='bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl h-full flex flex-col'>
                        <h2 className='text-pink-400 font-bold mb-3 uppercase tracking-wider text-sm flex items-center justify-between'>
                            <span>Bảng Xem Trước (Có thể cuộn ngang)</span>
                            <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-xs border border-pink-500/30">
                                {previewData.length} items
                            </span>
                        </h2>
                        
                        <div className='flex-1 border border-white/10 rounded-xl bg-black/40 relative overflow-hidden'>
                            {previewData.length > 0 ? (
                                /* Vùng chứa scroll ngang và dọc */
                                <div className='overflow-auto h-100 custom-scrollbar p-2'>
                                    <table className='w-full text-left whitespace-nowrap text-xs min-w-max'>
                                        <thead className='text-gray-400 border-b border-white/10 bg-slate-800/50 sticky top-0 z-10'>
                                            <tr>
                                                <th className='p-3'>Tên Phim</th>
                                                <th className='p-3'>Tên Gốc</th>
                                                <th className='p-3'>Loại Phim</th>
                                                <th className='p-3'>Thể Loại</th>
                                                <th className='p-3'>Đạo Diễn</th>
                                                <th className='p-3'>Diễn Viên</th>
                                                <th className='p-3'>Nhân Vật</th>
                                                <th className='p-3'>Quốc Gia</th>
                                                <th className='p-3'>Năm</th>
                                                <th className='p-3'>Số Tập</th>
                                                <th className='p-3'>Thời Lượng</th>
                                                <th className='p-3'>Độ Tuổi</th>
                                                <th className='p-3'>Trạng Thái</th>
                                                <th className='p-3'>Giá Thuê</th>
                                                <th className='p-3'>Lịch Chiếu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, idx) => (
                                                <tr key={idx} className='border-b border-white/5 hover:bg-white/5 text-gray-200 transition-colors'>
                                                    <td className='p-3 font-bold text-cyan-300'>{row.name}</td>
                                                    <td className='p-3 text-gray-400'>{row.otherName}</td>
                                                    <td className='p-3 text-purple-300'>{row.rawCategoryType}</td>
                                                    <td className='p-3 text-pink-300'>{row.rawCategories}</td>
                                                    <td className='p-3 text-green-300'>{row.rawAuthor}</td>
                                                    <td className='p-3 text-blue-300 max-w-37.5 truncate' title={row.rawActors}>{row.rawActors}</td>
                                                    <td className='p-3 text-orange-300 max-w-37.5 truncate' title={row.rawCharacters}>{row.rawCharacters}</td>
                                                    <td className='p-3'>{row.countriesID}</td>
                                                    <td className='p-3 text-yellow-400'>{row.releaseYear}</td>
                                                    <td className='p-3 font-mono'>{row.endEpisode}</td>
                                                    <td className='p-3 font-mono'>{row.duration}p</td>
                                                    <td className='p-3 font-mono'>{row.ageRating}</td>
                                                    <td className='p-3'>{row.status}</td>
                                                    <td className='p-3 font-mono text-green-400'>{row.rent.toLocaleString()}</td>
                                                    <td className='p-3'>{row.rawShowtimes}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className='absolute inset-0 flex flex-col items-center justify-center text-gray-500 opacity-50'>
                                    <FaMagic className='text-5xl mb-3' />
                                    <p>Chưa có dữ liệu preview</p>
                                </div>
                            )}
                        </div>

                        {successMsg && (
                            <div className='mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 flex items-center gap-2 text-sm font-bold animate-pulse'>
                                <FaCheckCircle /> {successMsg}
                            </div>
                        )}

                        <button 
                            onClick={handleExecuteImport}
                            disabled={loading || previewData.length === 0}
                            className={`w-full mt-4 py-3 rounded-xl font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2
                                ${previewData.length > 0 
                                    ? 'bg-linear-to-r from-pink-500 to-yellow-500 hover:from-pink-400 hover:to-yellow-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] cursor-pointer hover:shadow-[0_0_25px_rgba(234,179,8,0.7)] active:scale-95' 
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'}`}
                        >
                            {loading ? <FaSpinner className="spin text-xl" /> : "Xác Nhận Import Lên Cloud"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MagicImport;