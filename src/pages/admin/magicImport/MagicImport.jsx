import React, { useState, useContext } from 'react';
import { FaMagic, FaCloudUploadAlt, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { parseTSV, mapMovieData } from '../../../utils/MagicParser';
import { db } from '../../../config/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

import { CategoriesContext } from '../../../contexts/CategoryProvider';
import { AuthorContext } from '../../../contexts/AuthorProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { CategoryTypeContext } from '../../../contexts/CategoryTypeProvider';
import LOGO from "../../../assets/Logo.png";

function MagicImport() {
    const [inputText, setInputText] = useState("");
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Lấy dữ liệu từ Context
    const categories = useContext(CategoriesContext);
    const authors = useContext(AuthorContext);
    const plans = useContext(PlanContext);
    const categoryTypes = useContext(CategoryTypeContext);

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

    // Xử lý nút Import
    const handleExecuteImport = async () => {
        if (previewData.length === 0) return;
        setLoading(true);

        let localCategories = [...categories];
        let localAuthors = [...authors];

        const defaultPlanID = plans.length > 0 ? plans[0].id : "";
        const defaultCategoryTypeID = categoryTypes.length > 0 ? categoryTypes[0].id : "";

        try {
            for (const movie of previewData) {
                let list_Category = [];
                let authorID = "";

                if (movie.rawCategories) {
                    const catNames = movie.rawCategories.split(',').map(c => c.trim());
                    for (const cName of catNames) {
                        const existCat = localCategories.find(c => c.name.toLowerCase() === cName.toLowerCase());
                        if (existCat) {
                            list_Category.push(existCat.id);
                        } else {
                            const docRef = await addDoc(collection(db, "Categories"), { name: cName, description: "" });
                            list_Category.push(docRef.id);
                            localCategories.push({ id: docRef.id, name: cName });
                        }
                    }
                }

                if (movie.rawAuthor) {
                    const existAuthor = localAuthors.find(a => a.name.toLowerCase() === movie.rawAuthor.toLowerCase());
                    if (existAuthor) {
                        authorID = existAuthor.id;
                    } else {
                        const docRef = await addDoc(collection(db, "Authors"), { 
                            name: movie.rawAuthor, 
                            imgUrl: LOGO, 
                            description: "AI Auto Generated",
                            sexID: "Other",
                            countriesID: movie.countriesID
                        });
                        authorID = docRef.id;
                        localAuthors.push({ id: docRef.id, name: movie.rawAuthor });
                    }
                }

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
                    category_Type_Id: defaultCategoryTypeID,
                    list_Category: list_Category,
                    author: authorID,
                    list_Actor: [],
                    list_Character: [],
                    createdAt: new Date().toISOString()
                };

                await addDoc(collection(db, "Movies"), submitMovie);
            }

            setSuccessMsg(`Đã import thành công ${previewData.length} dữ liệu!`);
            setPreviewData([]);
            setInputText("");
        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra, vui lòng kiểm tra console!");
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
                    <p className='text-gray-400 text-sm mt-1'>Copy bảng từ Excel/ChatGPT và Paste vào đây để tự động phân tích & Import.</p>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <div className='flex flex-col gap-4'>
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

                <div className='flex flex-col gap-4'>
                    <div className='bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl h-full flex flex-col'>
                        <h2 className='text-pink-400 font-bold mb-3 uppercase tracking-wider text-sm flex items-center justify-between'>
                            <span>Bảng Xem Trước (Preview)</span>
                            <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-xs border border-pink-500/30">
                                {previewData.length} items
                            </span>
                        </h2>
                        
                        <div className='flex-1 border border-white/10 rounded-xl bg-black/40 overflow-hidden relative'>
                            {previewData.length > 0 ? (
                                <div className='overflow-auto h-82.5 custom-scrollbar p-2'>
                                    <table className='w-full text-left whitespace-nowrap text-xs'>
                                        <thead className='text-gray-400 border-b border-white/10'>
                                            <tr>
                                                <th className='p-2'>Tên Phim</th>
                                                <th className='p-2'>Quốc Gia</th>
                                                <th className='p-2'>Năm</th>
                                                <th className='p-2'>Thể Loại</th>
                                                <th className='p-2'>Đạo Diễn</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, idx) => (
                                                <tr key={idx} className='border-b border-white/5 hover:bg-white/5 text-gray-200'>
                                                    <td className='p-2 font-bold text-cyan-300'>{row.name}</td>
                                                    <td className='p-2'>{row.countriesID}</td>
                                                    <td className='p-2 text-yellow-400'>{row.releaseYear}</td>
                                                    <td className='p-2 text-pink-300 truncate max-w-30'>{row.rawCategories}</td>
                                                    <td className='p-2 text-green-300'>{row.rawAuthor}</td>
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