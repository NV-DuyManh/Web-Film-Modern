import { fetchDocumentsRealtime } from '../../../services/firebaseService';
import { useShowTimes, useMovies, useEpisodes } from '../../../hooks/useCollections';
import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { FaMagic, FaCloudUploadAlt, FaCheckCircle, FaFileExcel, FaTrash, FaExchangeAlt, FaRobot, FaCopy, FaPlay, FaEraser, FaPause, FaStop, FaGlobe, FaDatabase, FaSpider, FaBroom, FaSyncAlt, FaClock } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { parseTSV, mapMovieData } from './MagicParser';
import { db } from '../../../config/firebaseConfig';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

import { CategoryContext } from '../../../contexts/CategoryProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { CategoryTypeContext } from '../../../contexts/CategoryTypeProvider';

import { fetchMoviesList, fetchMovieDetails, fetchMovieImages, fetchAllCategories, fetchAllCountries, getFullImageUrl, mapMovieType, mapMovieStatus, parseDuration, stripHtml, mapCountryName } from '../../../services/kkphimService';

import LOGO from "../../../assets/Logo6.png";
import LOGO_BANNER from "../../../assets/Logo5.png";

// Helper chuyển chuỗi tiếng Việt có dấu thành slug không dấu
const slugify = (text) => {
    if (!text) return '';
    const vietnameseMap = {
        'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a','â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
        'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e','ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
        'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
        'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o','ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
        'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u','ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
        'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
        'đ':'d',
        'À':'a','Á':'a','Ả':'a','Ã':'a','Ạ':'a','Ă':'a','Ằ':'a','Ắ':'a','Ẳ':'a','Ẵ':'a','Ặ':'a','Â':'a','Ầ':'a','Ấ':'a','Ẩ':'a','Ẫ':'a','Ậ':'a',
        'È':'e','É':'e','Ẻ':'e','Ẽ':'e','Ẹ':'e','Ê':'e','Ề':'e','Ế':'e','Ể':'e','Ễ':'e','Ệ':'e',
        'Ì':'i','Í':'i','Ỉ':'i','Ĩ':'i','Ị':'i',
        'Ò':'o','Ó':'o','Ỏ':'o','Õ':'o','Ọ':'o','Ô':'o','Ồ':'o','Ố':'o','Ổ':'o','Ỗ':'o','Ộ':'o','Ơ':'o','Ờ':'o','Ớ':'o','Ở':'o','Ỡ':'o','Ợ':'o',
        'Ù':'u','Ú':'u','Ủ':'u','Ũ':'u','Ụ':'u','Ư':'u','Ừ':'u','Ứ':'u','Ử':'u','Ữ':'u','Ự':'u',
        'Ỳ':'y','Ý':'y','Ỷ':'y','Ỹ':'y','Ỵ':'y',
        'Đ':'d'
    };
    return text.split('').map(c => vietnameseMap[c] || c).join('')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

const normalizeStr = (str) => {
    if (!str) return '';
    return str.toString().trim().toLowerCase();
};

// Kiểm tra 2 bộ phim có phải là cùng 1 bộ phim không (so sánh chéo tên gốc, tên Việt, slug)
const isSameMovie = (m1, m2) => {
    if (!m1 || !m2) return false;
    if (m1.id && m2.id && m1.id === m2.id) return true;

    // So sánh Slug
    const s1 = slugify(m1.slug || m1.otherName || m1.name || '');
    const s2 = slugify(m2.slug || m2.otherName || m2.name || m2.origin_name || '');
    if (s1 && s2 && s1 === s2) return true;

    // So sánh Tên tiếng Việt và Tên gốc
    const n1 = normalizeStr(m1.name);
    const o1 = normalizeStr(m1.otherName);
    const n2 = normalizeStr(m2.name);
    const o2 = normalizeStr(m2.otherName || m2.origin_name);

    if (n1 && (n1 === n2 || n1 === o2)) return true;
    if (o1 && (o1 === n2 || o1 === o2)) return true;
    if (n2 && (n2 === n1 || n2 === o1)) return true;
    if (o2 && (o2 === n1 || o2 === o1)) return true;

    return false;
};

const findMatchingMovie = (movieList, candidate) => {
    if (!candidate || !movieList) return null;
    return movieList.find(m => isSameMovie(m, candidate)) || null;
};

function MagicImport() {
    const [actors, setActors] = useState([]);
    useEffect(() => { const unsub = fetchDocumentsRealtime("Actors", setActors); return () => unsub(); }, []);
    const [authors, setAuthors] = useState([]);
    useEffect(() => { const unsub = fetchDocumentsRealtime("Authors", setAuthors); return () => unsub(); }, []);
    const [characters, setCharacters] = useState([]);
    useEffect(() => { const unsub = fetchDocumentsRealtime("Characters", setCharacters); return () => unsub(); }, []);

    const [inputText, setInputText] = useState("");
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const [mode, setMode] = useState('IMPORT');

    const [visualProgress, setVisualProgress] = useState(0);
    const [currentImportIdx, setCurrentImportIdx] = useState(-1);
    const [rowStatuses, setRowStatuses] = useState({});

    const [promptCount, setPromptCount] = useState(5);
    const [promptTheme, setPromptTheme] = useState("Anime Isekai");

    const categories = useContext(CategoryContext) || [];
    const plans = useContext(PlanContext) || [];
    const categoryTypes = useContext(CategoryTypeContext) || [];
    
    const existingMovies = useMovies() || [];
    const existingShowtimes = useShowTimes() || [];
    const existingEpisodes = useEpisodes() || [];

    const [isDeduplicating, setIsDeduplicating] = useState(false);
    const [dedupMsg, setDedupMsg] = useState("");

    useEffect(() => {
        let timer;
        if (loading && previewData.length > 0) {
            const chunkSize = 100 / previewData.length;
            timer = setInterval(() => {
                setVisualProgress(prev => {
                    if (currentImportIdx >= 0) {
                        const currentCeiling = (currentImportIdx + 0.92) * chunkSize;
                        if (prev < currentCeiling) {
                            const step = Math.max(0.08, chunkSize / 70);
                            return Math.min(currentCeiling, parseFloat((prev + step).toFixed(2)));
                        }
                    }
                    return prev;
                });
            }, 25);
        }
        return () => clearInterval(timer);
    }, [loading, currentImportIdx, previewData.length]);

    const enrichWithMovieMapping = (mappedData) => {
        return mappedData.map(movie => {
            const match = findMatchingMovie(existingMovies, movie);
            return { ...movie, matchedMovieId: match ? match.id : "" };
        });
    };

    const handleParse = () => {
        if (!inputText || !inputText.trim()) {
            setErrorMsg("⚠️ Vui lòng dán dữ liệu vào ô Data Input Area trước khi Parse!");
            setTimeout(() => setErrorMsg(""), 4000);
            return;
        }

        const rawData = parseTSV(inputText);
        if (!rawData || rawData.length === 0) {
            setErrorMsg("⚠️ Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại cấu trúc copy từ Excel!");
            setTimeout(() => setErrorMsg(""), 4000);
            return;
        }

        const mapped = enrichWithMovieMapping(mapMovieData(rawData));
        setPreviewData(mapped);
        setRowStatuses({});
        setVisualProgress(0);
        setCurrentImportIdx(-1);
        setSuccessMsg("");
        setErrorMsg("");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSuccessMsg("");
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                if (!data || data.length === 0) {
                    setErrorMsg("⚠️ File Excel trống hoặc không hợp lệ!");
                    setTimeout(() => setErrorMsg(""), 4000);
                    return;
                }
                const formattedData = data.map(row => {
                    const newRow = {};
                    for (let key in row) newRow[key.toLowerCase().trim()] = String(row[key]);
                    return newRow;
                });
                const mapped = enrichWithMovieMapping(mapMovieData(formattedData));
                setPreviewData(mapped);
                setRowStatuses({});
                setVisualProgress(0);
                setCurrentImportIdx(-1);
                setSuccessMsg("");
                setErrorMsg("");
            } catch (err) {
                setErrorMsg("⚠️ Đã có lỗi xảy ra khi đọc file Excel!");
                setTimeout(() => setErrorMsg(""), 4000);
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };

    const handleRemoveRow = (indexToRemove) => {
        setPreviewData(prevData => prevData.filter((_, index) => index !== indexToRemove));
    };

    const handleClearAll = () => {
        setInputText("");
        setPreviewData([]);
        setRowStatuses({});
        setVisualProgress(0);
        setCurrentImportIdx(-1);
        setSuccessMsg("Đã dọn dẹp sạch sẽ dữ liệu!");
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    const handleCopyPrompt = () => {
        const promptText = `Hãy đóng vai một chuyên gia dữ liệu và một người đam mê điện ảnh/anime. Nhiệm vụ của bạn là tạo ra một bảng dữ liệu định dạng TSV (Tab-Separated Values) cho ${promptCount} bộ phim ${promptTheme}. 

Bảng dữ liệu phải có ĐÚNG 29 CỘT theo thứ tự sau, cách nhau bằng dấu Tab:
Name	Original Name	Movie Description	Type	Categories	Cat Desc	Director	Dir Desc	Actors	Actor Desc	Characters	Char Desc	Gender	Char Gender	Plan	Country	Year	Episodes	Ep Sub	Ep Dub	Ep Voice	Episode Number	URL	Room	Time	Status	Age Rating	Duration	Rent Price

BẠN PHẢI TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC SAU:

1. QUY TẮC ĐỐI ỨNG 1:1 VÀ DẤU PHÂN CÁCH: 
- Cột Name (Director, Actors, Characters, Categories) ngăn cách bằng dấu phẩy (,).
- Cột Description (Dir Desc, Actor Desc, Char Desc, Cat Desc) và Gender (Gender, Char Gender) BẮT BUỘC dùng dấu gạch đứng ( | ) để ngăn cách.
- Số lượng phần tử phải khớp nhau tuyệt đối (Số lượng diễn viên/đạo diễn = Số đoạn mô tả tương ứng).

2. QUY TẮC MÔ TẢ CHI TIẾT (RẤT QUAN TRỌNG):
- Độ dài: Các cột Movie Description, Cat Desc, Dir Desc, Actor Desc, Char Desc BẮT BUỘC phải chi tiết, MỖI ĐOẠN MÔ TẢ TỐI THIỂU 35 TỪ, TỐI ĐA 50 TỪ.
- Liên kết phim (Actor/Director): Mô tả Đạo diễn (Dir Desc) và Diễn viên (Actor Desc) BẮT BUỘC phải nhắc đến phong cách nghệ thuật của họ và đề cập đến một số bộ phim tiêu biểu khác mà họ từng tham gia.
- Xưng hô (Số ít): Khi mô tả Diễn viên, Đạo diễn, Nhân vật KHÔNG DÙNG từ chỉ số nhiều. Phải dùng danh xưng cá nhân (Ông, Bà, Anh, Cô, Cậu bé, Hắn...). Văn phong bách khoa toàn thư.

3. ĐỊNH DẠNG TRƯỜNG CỤ THỂ:
- Original Name: BẮT BUỘC phải là tên tiếng Việt chuẩn theo cách gọi phổ biến trên mạng tại Việt Nam (Ví dụ: Dragon Ball -> 7 Viên Ngọc Rồng, One Piece -> Đảo Hải Tặc). Tuyệt đối không để nguyên bản tiếng Anh, Romaji hay các ngôn ngữ khác ở cột này.
- URL: Sử dụng link mẫu: https://player.phimapi.com/player/?url=https://s6.kkphimplayer6.com/20251229/qOcvuFyt/index.m3u8 (BẮT BUỘC PHẢI SỬ DỤNG LINK NÀY, KHÔNG ĐƯỢC THAY ĐỔI).
- Type: "Phim Lẻ" hoặc "Phim Bộ".
- Plan: BẮT BUỘC chọn một trong các giá trị sau (ghi đúng chính tả): ${plans.length > 0 ? plans.map(p => `"${p.name}"`).join(', ') : '"Free"'}.
- Gender / Char Gender: Chỉ dùng "Male", "Female", hoặc "Other". (Nếu có nhiều Đạo diễn/Diễn viên, hãy ngăn cách giới tính bằng dấu gạch đứng tương ứng).
- Time: Định dạng ISO 8601 (VD: 2026-08-01T18:00).
- Status: "Đang chiếu", "Hoàn thành", "Sắp chiếu".
- Age Rating: "P", "K", "T13", "T16", "T18".
- Phân bổ Tập phim (Episodes, Ep Sub, Ep Dub, Ep Voice): Hãy phân bổ hợp lý. Bắt buộc Ep Sub, Ep Dub, Ep Voice ĐỀU PHẢI có ít nhất 1 tập (dù phim lẻ hay bộ, cứ tự chế đại số liệu) để đảm bảo dữ liệu phong phú, KHÔNG ĐƯỢC để bằng 0. Cột Episodes là tổng số tập phim.

MẪU 1 BỘ PHIM HOÀN CHỈNH (Hãy làm theo mẫu này):
Name: Jujutsu Kaisen 0
Original Name: Chú Thuật Hồi Chiến 0
Movie Description: Yuta Okkotsu là một thiếu niên nhút nhát vô tình bị ám bởi oán linh của cô bạn thanh mai trúc mã Rika Orimoto sau tai nạn thảm khốc, khiến cậu phải gia nhập trường Chú thuật để kiểm soát sức mạnh này.
Type: Phim Lẻ
Categories: Hành Động, Giả Tưởng
Cat Desc: Thể loại hành động sở hữu nhịp độ nhanh với các pha chiến đấu mãn nhãn, kịch tính | Thế giới giả tưởng hư cấu với hệ thống phép thuật độc đáo vượt ra ngoài định luật vật lý thông thường.
Director: Sunghoo Park, Gege Akutami
Dir Desc: Anh là một đạo diễn tài năng người Hàn Quốc nổi tiếng với các pha hành động mượt mà, từng ghi dấu ấn cực kỳ đậm nét qua The God of High School và Jujutsu Kaisen. | Ông là tác giả manga lừng danh người Nhật Bản, cha đẻ của siêu phẩm Chú Thuật Hồi Chiến đình đám toàn cầu.
Actors: Megumi Ogata, Kana Hanazawa
Actor Desc: Cô là một Seiyuu gạo cội chuyên lồng tiếng cho các nhân vật nam chính có nội tâm phức tạp, từng góp mặt trong siêu phẩm Neon Genesis Evangelion | Nữ diễn viên lồng tiếng hàng đầu này sở hữu chất giọng trong trẻo đặc trưng, từng tham gia rất nhiều dự án lớn như Psycho-Pass hay Tokyo Ghoul.
Characters: Yuta Okkotsu, Rika Orimoto
Char Desc: Cậu là một học sinh trung học mang trong mình nguồn chú lực khổng lồ nhưng lại luôn tự ti và sợ hãi sức mạnh của chính bản thân mình | Cô bé đáng thương này đã qua đời trong tai nạn giao thông và biến thành một oán linh đặc cấp luôn bảo vệ Yuta một cách thái quá.
Gender: Female | Female
Char Gender: Male | Female
Plan: Premium
Country: Japan
Year: 2021
Episodes: 1
Ep Sub: 1
Ep Dub: 1
Ep Voice: 1
Episode Number: 1
URL: https://player.phimapi.com/player/?url=https://s6.kkphimplayer6.com/20251229/qOcvuFyt/index.m3u8
Room: Room A
Time: 2026-07-05T19:30
Status: Hoàn thành
Age Rating: T16
Duration: 105
Rent Price: 30000

Hãy tạo dữ liệu thật phong phú và tự nhiên. Tùy cơ ứng biến số lượng thể loại, diễn viên, nhân vật sao cho thực tế và phù hợp với quy mô của từng phim (ít nhất là 4, phim có thể lên tới 15-20 người/thể loại). Tuyệt đối không được rập khuôn phim nào cũng có số lượng bằng nhau. Xuất kết quả dưới dạng text thuần (raw text) có thể copy được ngay.`;

        navigator.clipboard.writeText(promptText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleExecuteImport = async () => {
        if (previewData.length === 0) return;
        setLoading(true);
        setVisualProgress(0);
        setRowStatuses({});

        let localCategories = [...categories];
        let localAuthors = [...authors];
        let localActors = [...actors];
        let localCharacters = [...characters];
        let localCategoryTypes = [...categoryTypes];
        let localMovies = [...existingMovies];
        let localEpisodes = [...existingEpisodes];
        let localShowtimes = [...existingShowtimes];

        let moviesAdded = 0, moviesUpdated = 0, epsAdded = 0, showtimesAdded = 0;
        const totalRows = previewData.length;
        const chunkSize = 100 / totalRows;

        try {
            for (let idx = 0; idx < totalRows; idx++) {
                const movie = previewData[idx];

                setCurrentImportIdx(idx);
                setRowStatuses(prev => ({ ...prev, [idx]: 'processing' }));

                let currentMovieId = "";
                let existingMovie = null;
                if (movie.matchedMovieId) {
                    existingMovie = localMovies.find(m => m.id === movie.matchedMovieId);
                } else {
                    existingMovie = findMatchingMovie(localMovies, movie);
                }

                if (existingMovie && mode === 'IMPORT') {
                    currentMovieId = existingMovie.id;
                } else {
                    let listCategory = [];
                    let listActor = [];
                    let listCharacter = [];
                    let listAuthor = [];
                    let categoryTypeID = "";

                    if (movie.rawCategories) {
                        const names = movie.rawCategories.split(',').map(n => n.trim());
                        const descs = movie.rawCategoryDesc ? movie.rawCategoryDesc.split('|').map(d => d.trim()) : [];
                        for (let i = 0; i < names.length; i++) {
                            const name = names[i];
                            const exist = localCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
                            const finalDesc = descs[i] || "Đang cập nhật...";
                            if (exist) {
                                listCategory.push(exist.id);
                                if (mode === 'UPDATE') await updateDoc(doc(db, "Categories", exist.id), { description: finalDesc });
                            } else {
                                const newRef = doc(collection(db, "Categories"));
                                await setDoc(newRef, { id: newRef.id, name, description: finalDesc });
                                listCategory.push(newRef.id);
                                localCategories.push({ id: newRef.id, name });
                            }
                        }
                    }

                    if (movie.rawCategoryType) {
                        const exist = localCategoryTypes.find(c => c.name.toLowerCase() === movie.rawCategoryType.toLowerCase());
                        if (exist) categoryTypeID = exist.id;
                        else {
                            const newRef = doc(collection(db, "CategoryTypes"));
                            await setDoc(newRef, { id: newRef.id, name: movie.rawCategoryType, description: "Đang cập nhật..." });
                            categoryTypeID = newRef.id;
                            localCategoryTypes.push({ id: newRef.id, name: movie.rawCategoryType });
                        }
                    }

                    if (movie.rawAuthor) {
                        const names = movie.rawAuthor.split(',').map(n => n.trim());
                        const descs = movie.rawAuthorDesc ? movie.rawAuthorDesc.split('|').map(d => d.trim()) : [];
                        const genders = movie.gender ? movie.gender.split('|').map(g => g.trim()) : [];
                        for (let i = 0; i < names.length; i++) {
                            const name = names[i];
                            const finalDesc = descs[i] || "Đang cập nhật...";
                            const finalGender = genders[i] || "Male";

                            const exist = localAuthors.find(a => a.name.toLowerCase() === name.toLowerCase());
                            if (exist) {
                                listAuthor.push(exist.id);
                                if (mode === 'UPDATE') await updateDoc(doc(db, "Authors", exist.id), { description: finalDesc, sexID: finalGender });
                            } else {
                                const newRef = doc(collection(db, "Authors"));
                                await setDoc(newRef, { id: newRef.id, name, imgUrl: LOGO, description: finalDesc, sexID: finalGender, countriesID: movie.countriesID });
                                listAuthor.push(newRef.id);
                                localAuthors.push({ id: newRef.id, name });
                            }
                        }
                    }

                    if (movie.rawActors) {
                        const names = movie.rawActors.split(',').map(n => n.trim());
                        const descs = movie.rawActorDesc ? movie.rawActorDesc.split('|').map(d => d.trim()) : [];
                        const genders = movie.gender ? movie.gender.split('|').map(g => g.trim()) : [];
                        for (let i = 0; i < names.length; i++) {
                            const name = names[i];
                            const finalDesc = descs[i] || "Đang cập nhật...";
                            const finalGender = genders[i] || "Male";

                            const exist = localActors.find(a => a.name.toLowerCase() === name.toLowerCase());
                            if (exist) {
                                listActor.push(exist.id);
                                if (mode === 'UPDATE') await updateDoc(doc(db, "Actors", exist.id), { description: finalDesc, sexID: finalGender });
                            } else {
                                const newRef = doc(collection(db, "Actors"));
                                await setDoc(newRef, { id: newRef.id, name, imgUrl: LOGO, description: finalDesc, sexID: finalGender, countriesID: movie.countriesID });
                                listActor.push(newRef.id);
                                localActors.push({ id: newRef.id, name });
                            }
                        }
                    }

                    if (movie.rawCharacters) {
                        const names = movie.rawCharacters.split(',').map(n => n.trim());
                        const descs = movie.rawCharacterDesc ? movie.rawCharacterDesc.split('|').map(d => d.trim()) : [];
                        const genders = movie.charGender ? movie.charGender.split('|').map(g => g.trim()) : [];
                        for (let i = 0; i < names.length; i++) {
                            const name = names[i];
                            const finalDesc = descs[i] || "Đang cập nhật...";
                            const finalGender = genders[i] || "Male";

                            const exist = localCharacters.find(c => c.name.toLowerCase() === name.toLowerCase());
                            if (exist) {
                                listCharacter.push(exist.id);
                                if (mode === 'UPDATE') await updateDoc(doc(db, "Characters", exist.id), { description: finalDesc, sexID: finalGender });
                            } else {
                                const newRef = doc(collection(db, "Characters"));
                                await setDoc(newRef, { id: newRef.id, name, imgUrl: LOGO, description: finalDesc, sexID: finalGender, countriesID: movie.countriesID });
                                listCharacter.push(newRef.id);
                                localCharacters.push({ id: newRef.id, name });
                            }
                        }
                    }

                    let finalPlanID = plans.length > 0 ? plans[0].id : "";
                    if (movie.rawPlan) {
                        const foundPlan = plans.find(p => p.name.toLowerCase() === movie.rawPlan.toLowerCase());
                        if (foundPlan) finalPlanID = foundPlan.id;
                    }

                    if (existingMovie && mode === 'UPDATE') {
                        currentMovieId = existingMovie.id;
                        const movieRef = doc(db, "Movies", currentMovieId);
                        const updateData = { updatedAt: new Date().toISOString() };
                        if (movie.description !== "Đang cập nhật...") updateData.description = movie.description;
                        if (movie.duration > 0) updateData.duration = movie.duration;
                        if (movie.rent >= 0) updateData.rent = movie.rent;
                        if (movie.releaseYear) updateData.releaseYear = movie.releaseYear;
                        if (categoryTypeID) updateData.categoryTypeID = categoryTypeID;

                        updateData.listCategory = Array.from(new Set([...(existingMovie.listCategory || []), ...listCategory]));
                        updateData.listActor = Array.from(new Set([...(existingMovie.listActor || []), ...listActor]));
                        updateData.listCharacter = Array.from(new Set([...(existingMovie.listCharacter || []), ...listCharacter]));
                        updateData.listAuthor = Array.from(new Set([...(existingMovie.listAuthor || []), ...listAuthor]));

                        await updateDoc(movieRef, updateData);
                        moviesUpdated++;
                    } else if (!existingMovie) {
                        const movieRef = doc(collection(db, "Movies"));
                        currentMovieId = movieRef.id;
                        const submitMovie = {
                            ...movie, id: currentMovieId, imgUrl: LOGO, bannerUrl: LOGO_BANNER, listCategory, listActor, listCharacter, listAuthor,
                            categoryTypeID, planID: finalPlanID, createdAt: new Date().toISOString()
                        };
                        Object.keys(submitMovie).forEach(key => {
                            if (key.startsWith('raw') || ['gender', 'charGender', 'roomName', 'epNumber', 'epUrl', 'matchedMovieId'].includes(key)) {
                                delete submitMovie[key];
                            }
                        });
                        await setDoc(movieRef, submitMovie);
                        localMovies.push({ id: currentMovieId, name: movie.name, otherName: movie.otherName || '', slug: movie.slug || slugify(movie.name) });
                        moviesAdded++;
                    }
                }

                if (movie.epNumber && movie.epUrl) {
                    const epExists = localEpisodes.find(e => e.movieID === currentMovieId && e.numberEpisode === Number(movie.epNumber));
                    if (!epExists) {
                        const epRef = doc(collection(db, "Episodes"));
                        await setDoc(epRef, { 
                            id: epRef.id, 
                            movieID: currentMovieId, 
                            title: movie.name,
                            numberEpisode: Number(movie.epNumber), 
                            url: movie.epUrl
                        });
                        localEpisodes.push({ movieID: currentMovieId, numberEpisode: Number(movie.epNumber) });
                        epsAdded++;
                    }
                }

                if (movie.rawShowtimes && movie.roomName) {
                    const stExists = localShowtimes.find(s => s.movieId === currentMovieId && s.roomName === movie.roomName && s.time === movie.rawShowtimes);
                    if (!stExists) {
                        const stRef = doc(collection(db, "ShowTimes"));
                        await setDoc(stRef, { id: stRef.id, movieId: currentMovieId, time: movie.rawShowtimes, roomName: movie.roomName, createdAt: new Date().toISOString() });
                        localShowtimes.push({ movieId: currentMovieId, roomName: movie.roomName, time: movie.rawShowtimes });
                        showtimesAdded++;
                    }
                }

                setRowStatuses(prev => ({ ...prev, [idx]: 'success' }));
                setVisualProgress((idx + 1) * chunkSize);
            }

            setSuccessMsg(`Import successful! Created ${moviesAdded} Movies, Updated ${moviesUpdated} Movies/Entities.`);
        } catch (error) {
            alert("An error occurred! Please check F12 Console for details.");
        } finally {
            setLoading(false);
            setCurrentImportIdx(-1);
            setVisualProgress(100);
        }
    };

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        if (s === "ongoing" || s === "đang chiếu") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        if (s === "completed" || s === "hoàn thành") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    };

    // ==================== KKPHIM CRAWLER ====================
    const [mainTab, setMainTab] = useState('MANUAL'); // 'MANUAL' | 'CRAWLER'
    const [crawlPageStart, setCrawlPageStart] = useState(1);
    const [crawlPageEnd, setCrawlPageEnd] = useState(5);
    const [crawlDelay, setCrawlDelay] = useState(1500);
    const [crawlStatus, setCrawlStatus] = useState('idle'); // idle | running | paused | done
    const [crawlLogs, setCrawlLogs] = useState([]);
    const [crawlStats, setCrawlStats] = useState({ movies: 0, episodes: 0, categories: 0, actors: 0, directors: 0, pages: 0, errors: 0 });
    const [crawlProgress, setCrawlProgress] = useState(0);
    const crawlAbortRef = useRef(false);
    const crawlPauseRef = useRef(false);

    const addCrawlLog = useCallback((message, type = 'info') => {
        setCrawlLogs(prev => [{ message, type, time: new Date().toLocaleTimeString('vi-VN') }, ...prev].slice(0, 500));
    }, []);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleStartCrawl = async () => {
        if (crawlStatus === 'running') return;
        crawlAbortRef.current = false;
        crawlPauseRef.current = false;
        setCrawlStatus('running');
        setCrawlLogs([]);
        setCrawlProgress(0);
        setCrawlStats({ movies: 0, episodes: 0, categories: 0, actors: 0, directors: 0, pages: 0, errors: 0 });

        let localCategories = [...categories];
        let localAuthors = [...authors];
        let localActors = [...actors];
        let localCategoryTypes = [...categoryTypes];
        let localMovies = [...existingMovies];
        let stats = { movies: 0, episodes: 0, categories: 0, actors: 0, directors: 0, pages: 0, errors: 0 };
        const totalPages = crawlPageEnd - crawlPageStart + 1;
        let finalPlanID = plans.length > 0 ? plans[0].id : "";

        addCrawlLog(`🚀 Bắt đầu crawl từ trang ${crawlPageStart} đến trang ${crawlPageEnd} (${totalPages} trang)`, 'success');

        try {
            for (let page = crawlPageStart; page <= crawlPageEnd; page++) {
                if (crawlAbortRef.current) { addCrawlLog('⛔ Đã dừng crawl theo yêu cầu.', 'error'); break; }
                while (crawlPauseRef.current) { await sleep(500); }

                addCrawlLog(`📄 Đang lấy danh sách phim trang ${page}/${crawlPageEnd}...`);
                let listData;
                try {
                    listData = await fetchMoviesList(page);
                } catch (err) {
                    addCrawlLog(`❌ Lỗi lấy trang ${page}: ${err.message}`, 'error');
                    stats.errors++;
                    setCrawlStats({ ...stats });
                    await sleep(crawlDelay);
                    continue;
                }

                const items = listData?.data?.items || [];
                if (items.length === 0) { addCrawlLog(`⚠️ Trang ${page} không có dữ liệu, bỏ qua.`, 'warning'); continue; }
                addCrawlLog(`✅ Trang ${page}: Tìm thấy ${items.length} phim.`, 'success');

                for (let i = 0; i < items.length; i++) {
                    const currentProgress = ((page - crawlPageStart) / totalPages) * 100 + ((i + 1) / items.length) * (100 / totalPages);
                    setCrawlProgress(Math.round(currentProgress));

                    if (crawlAbortRef.current) break;
                    while (crawlPauseRef.current) { await sleep(500); }

                    const item = items[i];
                    const slug = item.slug;
                    if (!slug) continue;

                    // Skip nếu phim đã tồn tại trong database (kiểm tra sơ bộ)
                    const candidatePre = {
                        name: item.origin_name || item.name,
                        otherName: item.name,
                        slug: item.slug || slugify(item.name)
                    };
                    const existCheck1 = findMatchingMovie(localMovies, candidatePre);
                    if (existCheck1) {
                        addCrawlLog(`⏭️ Bỏ qua "${item.name}" (đã tồn tại trong hệ thống).`);
                        continue;
                    }

                    addCrawlLog(`🔍 [${i + 1}/${items.length}] Đang lấy chi tiết: ${item.name}...`);
                    let detail;
                    try {
                        detail = await fetchMovieDetails(slug);
                        await sleep(Math.max(300, crawlDelay / 2));
                    } catch (err) {
                        addCrawlLog(`❌ Lỗi lấy chi tiết "${item.name}": ${err.message}`, 'error');
                        stats.errors++;
                        setCrawlStats({ ...stats });
                        continue;
                    }

                    const movieData = detail?.movie;
                    const episodesData = detail?.episodes || [];
                    if (!movieData) { addCrawlLog(`⚠️ Không có dữ liệu chi tiết cho "${item.name}".`, 'warning'); continue; }

                    // Kiểm tra kỹ lại lần 2 với tên gốc và tên tiếng Việt đầy đủ từ detail
                    const candidateDetail = {
                        name: movieData.origin_name || item.name,
                        otherName: movieData.name || item.name,
                        slug: movieData.slug || slugify(movieData.name || movieData.origin_name || item.name)
                    };
                    const existCheck2 = findMatchingMovie(localMovies, candidateDetail);
                    if (existCheck2) {
                        addCrawlLog(`⏭️ Bỏ qua "${movieData.name || item.name}" (đã tồn tại trong hệ thống).`);
                        continue;
                    }

                    // === Map Categories ===
                    let listCategory = [];
                    if (movieData.category && movieData.category.length > 0) {
                        for (const cat of movieData.category) {
                            const catName = cat.name;
                            if (!catName) continue;
                            const exist = localCategories.find(c => c.name?.toLowerCase() === catName.toLowerCase());
                            if (exist) {
                                listCategory.push(exist.id);
                            } else {
                                const newRef = doc(collection(db, "Categories"));
                                await setDoc(newRef, { id: newRef.id, name: catName, description: "Đang cập nhật..." });
                                listCategory.push(newRef.id);
                                localCategories.push({ id: newRef.id, name: catName });
                                stats.categories++;
                            }
                        }
                    }

                    // === Map CategoryType ===
                    let categoryTypeID = "";
                    const typeName = mapMovieType(movieData.type);
                    const existType = localCategoryTypes.find(c => c.name?.toLowerCase() === typeName.toLowerCase());
                    if (existType) categoryTypeID = existType.id;
                    else {
                        const newRef = doc(collection(db, "CategoryTypes"));
                        await setDoc(newRef, { id: newRef.id, name: typeName, description: "Đang cập nhật..." });
                        categoryTypeID = newRef.id;
                        localCategoryTypes.push({ id: newRef.id, name: typeName });
                    }

                    // === Map Directors ===
                    let listAuthor = [];
                    if (movieData.director && movieData.director.length > 0) {
                        for (const dirName of movieData.director) {
                            if (!dirName || dirName === "Đang cập nhật") continue;
                            const exist = localAuthors.find(a => a.name?.toLowerCase() === dirName.toLowerCase());
                            if (exist) {
                                listAuthor.push(exist.id);
                            } else {
                                const newRef = doc(collection(db, "Authors"));
                                await setDoc(newRef, { id: newRef.id, name: dirName, imgUrl: LOGO, description: "Đang cập nhật...", sexID: "Male", countriesID: mapCountryName(movieData.country) });
                                listAuthor.push(newRef.id);
                                localAuthors.push({ id: newRef.id, name: dirName });
                                stats.directors++;
                            }
                        }
                    }

                    // === Map Actors ===
                    let listActor = [];
                    if (movieData.actor && movieData.actor.length > 0) {
                        for (const actorName of movieData.actor) {
                            if (!actorName || actorName === "Đang cập nhật") continue;
                            const exist = localActors.find(a => a.name?.toLowerCase() === actorName.toLowerCase());
                            if (exist) {
                                listActor.push(exist.id);
                            } else {
                                const newRef = doc(collection(db, "Actors"));
                                await setDoc(newRef, { id: newRef.id, name: actorName, imgUrl: LOGO, description: "Đang cập nhật...", sexID: "Male", countriesID: mapCountryName(movieData.country) });
                                listActor.push(newRef.id);
                                localActors.push({ id: newRef.id, name: actorName });
                                stats.actors++;
                            }
                        }
                    }

                    // === Create Movie ===
                    const movieRef = doc(collection(db, "Movies"));
                    const newMovieId = movieRef.id;
                    const posterUrl = getFullImageUrl(movieData.poster_url);
                    const thumbUrl = getFullImageUrl(movieData.thumb_url);
                    const submitMovie = {
                        id: newMovieId,
                        slug: slugify(movieData.name || movieData.origin_name || item.name),
                        name: movieData.origin_name || item.name,
                        otherName: movieData.name || '',
                        description: stripHtml(movieData.content),
                        imgUrl: posterUrl || LOGO,
                        bannerUrl: thumbUrl || LOGO_BANNER,
                        listCategory,
                        listActor,
                        listCharacter: [],
                        listAuthor,
                        categoryTypeID,
                        planID: finalPlanID,
                        countriesID: mapCountryName(movieData.country),
                        releaseYear: movieData.year || new Date().getFullYear(),
                        duration: parseDuration(movieData.time),
                        rent: 0,
                        status: mapMovieStatus(movieData.status),
                        ageRating: 'T13',
                        endEpisode: movieData.episode_total || 1,
                        hasSub: movieData.lang?.includes('Vietsub') || false,
                        hasDub: movieData.lang?.includes('Thuyết Minh') || false,
                        hasVoice: movieData.lang?.includes('Lồng Tiếng') || false,
                        episodeSub: 0,
                        episodeDub: 0,
                        episodeVoice: 0,
                        createdAt: new Date().toISOString(),
                    };
                    await setDoc(movieRef, submitMovie);
                    localMovies.push({ id: newMovieId, name: submitMovie.name, otherName: submitMovie.otherName, slug: submitMovie.slug });
                    stats.movies++;

                    // === Fetch Gallery Images ===
                    try {
                        const galleryUrls = await fetchMovieImages(slug);
                        if (galleryUrls.length > 0) {
                            await updateDoc(movieRef, { gallery: galleryUrls });
                            addCrawlLog(`🖼️ Lấy được ${galleryUrls.length} ảnh gallery cho "${submitMovie.name}".`);
                        }
                    } catch { /* ignore gallery errors */ }

                    // === Create Episodes ===
                    if (episodesData.length > 0) {
                        const firstServer = episodesData[0];
                        const serverData = firstServer?.server_data || [];
                        for (const ep of serverData) {
                            const epNumMatch = ep.name?.match(/(\d+)/);
                            const epNum = epNumMatch ? parseInt(epNumMatch[1]) : 1;
                            const epUrl = ep.link_m3u8 || ep.link_embed || '';
                            const epUrl2 = ep.link_embed || '';
                            if (!epUrl) continue;
                            const epRef = doc(collection(db, "Episodes"));
                            await setDoc(epRef, {
                                id: epRef.id,
                                movieID: newMovieId,
                                title: submitMovie.name,
                                numberEpisode: epNum,
                                url: epUrl,
                                url2: epUrl2 !== epUrl ? epUrl2 : '',
                            });
                            stats.episodes++;
                        }
                        // Count sub/dub/voice
                        let subCount = 0, dubCount = 0, voiceCount = 0;
                        episodesData.forEach(server => {
                            const sName = server.server_name?.toLowerCase() || '';
                            const count = server.server_data?.length || 0;
                            if (sName.includes('vietsub') || sName === 'vietsub') subCount += count;
                            else if (sName.includes('thuyết minh') || sName.includes('thuyet-minh')) dubCount += count;
                            else if (sName.includes('lồng tiếng') || sName.includes('long-tieng')) voiceCount += count;
                            else subCount += count;
                        });
                        await updateDoc(movieRef, { episodeSub: subCount, episodeDub: dubCount, episodeVoice: voiceCount });
                    }

                    setCrawlStats({ ...stats });
                    addCrawlLog(`✅ Đã lưu: "${submitMovie.name}" (${stats.movies} phim | ${stats.episodes} tập)`, 'success');
                }

                stats.pages++;
                setCrawlStats({ ...stats });
                addCrawlLog(`📊 Hoàn thành trang ${page}/${crawlPageEnd}. Tổng: ${stats.movies} phim, ${stats.episodes} tập.`, 'success');
                if (page < crawlPageEnd) await sleep(crawlDelay);
            }
        } catch (err) {
            addCrawlLog(`💥 Lỗi nghiêm trọng: ${err.message}`, 'error');
        } finally {
            setCrawlStatus('done');
            setCrawlProgress(100);
            addCrawlLog(`🏁 Crawl hoàn tất! Tổng kết: ${stats.movies} phim, ${stats.episodes} tập, ${stats.categories} thể loại mới, ${stats.actors} diễn viên mới, ${stats.directors} đạo diễn mới, ${stats.errors} lỗi.`, 'success');
        }
    };

    const handlePauseCrawl = () => { crawlPauseRef.current = !crawlPauseRef.current; setCrawlStatus(crawlPauseRef.current ? 'paused' : 'running'); addCrawlLog(crawlPauseRef.current ? '⏸️ Đã tạm dừng crawl.' : '▶️ Tiếp tục crawl...', 'warning'); };
    const handleStopCrawl = () => { crawlAbortRef.current = true; crawlPauseRef.current = false; setCrawlStatus('idle'); };

    // === Auto Fix Missing Slugs ===
    const autoFixSlugs = useCallback(async () => {
        const moviesToFix = existingMovies.filter(m => {
            if (!m.otherName) return !m.slug; // Nếu không có otherName, chỉ fix nếu chưa có slug
            const expectedSlug = slugify(m.otherName);
            return expectedSlug && m.slug !== expectedSlug; // Fix nếu slug chưa đúng với otherName
        });
        if (moviesToFix.length === 0) return;
        console.log(`[AutoFix] Đang tự động tạo slug cho ${moviesToFix.length} phim...`);
        let fixed = 0;
        for (const movie of moviesToFix) {
            const newSlug = slugify(movie.otherName || movie.name || '');
            if (newSlug) {
                try {
                    await updateDoc(doc(db, "Movies", movie.id), { slug: newSlug });
                    fixed++;
                } catch (e) { console.error(`[AutoFix] Lỗi slug "${movie.name}":`, e); }
            }
        }
        console.log(`[AutoFix] ✅ Đã tạo slug cho ${fixed}/${moviesToFix.length} phim.`);
    }, [existingMovies]);

    // Tự động fix slug khi vào trang MagicImport
    useEffect(() => {
        if (existingMovies.length > 0) {
            autoFixSlugs();
        }
    }, [existingMovies]);

    // === Dọn dẹp và xóa phim trùng lặp ===
    const handleDeduplicateMovies = async () => {
        if (existingMovies.length === 0) return;
        const confirm = window.confirm(`Hệ thống sẽ quét và tự động gộp/xóa các bản ghi phim trùng lặp (dựa trên tên tiếng Việt, tên gốc và slug) trong tổng số ${existingMovies.length} phim hiện có.\n\nBạn có muốn tiếp tục không?`);
        if (!confirm) return;

        setIsDeduplicating(true);
        setDedupMsg("🔍 Đang quét và phân tích phim trùng lặp...");
        try {
            const groups = [];
            const processedIds = new Set();

            for (let i = 0; i < existingMovies.length; i++) {
                const m1 = existingMovies[i];
                if (processedIds.has(m1.id)) continue;

                const group = [m1];
                processedIds.add(m1.id);

                for (let j = i + 1; j < existingMovies.length; j++) {
                    const m2 = existingMovies[j];
                    if (processedIds.has(m2.id)) continue;

                    if (isSameMovie(m1, m2)) {
                        group.push(m2);
                        processedIds.add(m2.id);
                    }
                }

                if (group.length > 1) {
                    groups.push(group);
                }
            }

            if (groups.length === 0) {
                setDedupMsg("✅ Tuyệt vời! Không có phim nào bị trùng lặp trong hệ thống.");
                setTimeout(() => setDedupMsg(""), 4000);
                setIsDeduplicating(false);
                return;
            }

            let totalDeleted = 0;
            setDedupMsg(`⚡ Đã tìm thấy ${groups.length} nhóm phim trùng. Đang tiến hành gộp tập phim và xóa bản ghi trùng...`);

            for (const group of groups) {
                // Chọn bản ghi chính (bản ghi đầu tiên), các bản ghi còn lại là trùng
                const primaryMovie = group[0];
                const duplicateMovies = group.slice(1);

                for (const dup of duplicateMovies) {
                    // Chuyển toàn bộ tập phim của bản ghi trùng sang phim chính
                    const dupEpisodes = existingEpisodes.filter(e => e.movieID === dup.id);
                    for (const ep of dupEpisodes) {
                        const epExistInPrimary = existingEpisodes.find(e => e.movieID === primaryMovie.id && e.numberEpisode === ep.numberEpisode);
                        if (!epExistInPrimary) {
                            await updateDoc(doc(db, "Episodes", ep.id), { movieID: primaryMovie.id, title: primaryMovie.name });
                        } else {
                            await deleteDoc(doc(db, "Episodes", ep.id));
                        }
                    }

                    // Chuyển lịch chiếu sang phim chính
                    const dupShowtimes = existingShowtimes.filter(s => s.movieId === dup.id);
                    for (const st of dupShowtimes) {
                        await updateDoc(doc(db, "ShowTimes", st.id), { movieId: primaryMovie.id });
                    }

                    // Xóa bản ghi phim trùng lặp khỏi Firestore
                    await deleteDoc(doc(db, "Movies", dup.id));
                    totalDeleted++;
                }
            }

            setDedupMsg(`🎉 Đã dọn dẹp thành công! Đã xóa ${totalDeleted} bản ghi phim trùng lặp.`);
            setTimeout(() => setDedupMsg(""), 6000);
        } catch (err) {
            console.error("Lỗi khi dọn dẹp phim trùng lặp:", err);
            setDedupMsg(`❌ Lỗi: ${err.message}`);
        } finally {
            setIsDeduplicating(false);
        }
    };

    // ==================== KKPHIM AUTO-SYNC EPISODES ====================
    const [syncPages, setSyncPages] = useState(2); // Số trang phim mới quét (1 trang ~ 24 phim)
    const [syncStatus, setSyncStatus] = useState('idle'); // idle | running | done
    const [syncLogs, setSyncLogs] = useState([]);
    const [syncStats, setSyncStats] = useState({ checked: 0, moviesUpdated: 0, newEpisodes: 0, errors: 0 });
    const [syncProgress, setSyncProgress] = useState(0);
    const [autoCronInterval, setAutoCronInterval] = useState(() => {
        return Number(localStorage.getItem('kkphim_auto_sync_interval') || 0); // 0 = tắt, 15, 30, 60 (phút)
    });
    const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('kkphim_last_sync_time') || '');
    const syncAbortRef = useRef(false);

    const addSyncLog = useCallback((message, type = 'info') => {
        setSyncLogs(prev => [{ message, type, time: new Date().toLocaleTimeString('vi-VN') }, ...prev].slice(0, 500));
    }, []);

    const handleSetAutoCron = (val) => {
        setAutoCronInterval(val);
        localStorage.setItem('kkphim_auto_sync_interval', val.toString());
        if (val > 0) {
            addSyncLog(`⏰ Đã kích hoạt chế độ tự động kiểm tra tập mới mỗi ${val} phút.`, 'success');
        } else {
            addSyncLog(`⏹️ Đã tắt chế độ tự động kiểm tra tập mới.`, 'warning');
        }
    };

    const handleStartSync = async () => {
        if (syncStatus === 'running') return;
        syncAbortRef.current = false;
        setSyncStatus('running');
        setSyncLogs([]);
        setSyncProgress(0);
        const stats = { checked: 0, moviesUpdated: 0, newEpisodes: 0, errors: 0 };
        setSyncStats(stats);

        addSyncLog(`🚀 Bắt đầu quét tập mới từ ${syncPages} trang mới nhất của KKPhim (~${syncPages * 24} phim)...`, 'info');

        try {
            for (let page = 1; page <= syncPages; page++) {
                if (syncAbortRef.current) { addSyncLog('⛔ Đã dừng đồng bộ.', 'error'); break; }

                addSyncLog(`📄 Đang kiểm tra trang ${page}/${syncPages}...`);
                let listData;
                try {
                    listData = await fetchMoviesList(page);
                } catch (err) {
                    addSyncLog(`❌ Lỗi tải trang ${page}: ${err.message}`, 'error');
                    stats.errors++;
                    setSyncStats({ ...stats });
                    await sleep(1000);
                    continue;
                }

                const items = listData?.data?.items || [];
                if (items.length === 0) continue;

                for (let i = 0; i < items.length; i++) {
                    if (syncAbortRef.current) break;

                    const currentProgress = ((page - 1) / syncPages) * 100 + ((i + 1) / items.length) * (100 / syncPages);
                    setSyncProgress(Math.round(currentProgress));

                    const item = items[i];
                    stats.checked++;
                    setSyncStats({ ...stats });

                    // Kiểm tra xem phim này có trong database của ta không
                    const matchedMovie = findMatchingMovie(existingMovies, {
                        name: item.origin_name || item.name,
                        otherName: item.name,
                        slug: item.slug
                    });

                    if (!matchedMovie) {
                        // Phim này chưa có trong kho phim -> bỏ qua
                        continue;
                    }

                    // Nếu có phim trong kho -> Lấy chi tiết tập phim từ KKPhim
                    let detail;
                    try {
                        detail = await fetchMovieDetails(item.slug);
                        await sleep(Math.max(250, crawlDelay / 3));
                    } catch (err) {
                        stats.errors++;
                        setSyncStats({ ...stats });
                        continue;
                    }

                    const movieData = detail?.movie;
                    const episodesData = detail?.episodes || [];
                    if (!episodesData || episodesData.length === 0) continue;

                    // Lấy danh sách tập hiện có của phim trong database
                    const currentMovieEps = existingEpisodes.filter(e => e.movieID === matchedMovie.id);
                    const currentEpMap = new Map(currentMovieEps.map(e => [Number(e.numberEpisode), e]));

                    let newEpsCountForThisMovie = 0;
                    let fixedEpsCountForThisMovie = 0;
                    let highestEp = matchedMovie.endEpisode || 0;

                    const firstServer = episodesData[0];
                    const serverData = firstServer?.server_data || [];

                    for (const ep of serverData) {
                        const epNum = parseInt(ep.name.replace(/[^0-9]/g, '')) || 1;
                        if (epNum > highestEp) highestEp = epNum;

                        const existingEp = currentEpMap.get(epNum);

                        if (!existingEp) {
                            // 1. Thêm tập mới chưa có
                            const epRef = doc(collection(db, "Episodes"));
                            await setDoc(epRef, {
                                id: epRef.id,
                                movieID: matchedMovie.id,
                                title: matchedMovie.name,
                                numberEpisode: epNum,
                                nameEpisode: ep.name || `Tập ${epNum}`,
                                url: ep.link_embed || '',
                                urlM3u8: ep.link_m3u8 || '',
                                description: "Đang cập nhật...",
                                createdAt: new Date().toISOString(),
                            });
                            currentEpMap.set(epNum, { id: epRef.id, numberEpisode: epNum, url: ep.link_embed, urlM3u8: ep.link_m3u8 });
                            newEpsCountForThisMovie++;
                            stats.newEpisodes++;
                            setSyncStats({ ...stats });
                        } else {
                            // 2. Sửa lại link nếu link cũ bị sai, rác ("vdvdfv") hoặc không chuẩn
                            const isDummyOrBroken = !existingEp.url || 
                                                    !existingEp.url.startsWith('http') || 
                                                    existingEp.url !== ep.link_embed || 
                                                    existingEp.urlM3u8 !== ep.link_m3u8;

                            if (isDummyOrBroken && (ep.link_embed || ep.link_m3u8)) {
                                const epRef = doc(db, "Episodes", existingEp.id);
                                await updateDoc(epRef, {
                                    url: ep.link_embed || existingEp.url || '',
                                    urlM3u8: ep.link_m3u8 || existingEp.urlM3u8 || '',
                                    nameEpisode: ep.name || existingEp.nameEpisode || `Tập ${epNum}`,
                                    title: matchedMovie.name || existingEp.title || '',
                                    updatedAt: new Date().toISOString()
                                });
                                fixedEpsCountForThisMovie++;
                            }
                        }
                    }

                    if (newEpsCountForThisMovie > 0 || fixedEpsCountForThisMovie > 0) {
                        // Cập nhật trạng thái và số tập của phim
                        const movieRef = doc(db, "Movies", matchedMovie.id);
                        const updatePayload = {
                            endEpisode: Math.max(highestEp, matchedMovie.endEpisode || 1),
                            status: movieData?.status ? mapMovieStatus(movieData.status) : (matchedMovie.status || 'Đang chiếu'),
                            updatedAt: new Date().toISOString()
                        };
                        await updateDoc(movieRef, updatePayload);

                        stats.moviesUpdated++;
                        setSyncStats({ ...stats });
                        addSyncLog(`🎉 CẬP NHẬT THÀNH CÔNG: "${matchedMovie.otherName || matchedMovie.name}" (+${newEpsCountForThisMovie} tập mới, sửa ${fixedEpsCountForThisMovie} link tập)`, 'success');
                    } else {
                        addSyncLog(`✔️ "${matchedMovie.otherName || matchedMovie.name}" đã chuẩn xác đủ ${currentEpMap.size} tập, không cần sửa.`);
                    }
                }
                await sleep(500);
            }

            const nowStr = new Date().toLocaleString('vi-VN');
            setLastSyncTime(nowStr);
            localStorage.setItem('kkphim_last_sync_time', nowStr);
            setSyncStatus('done');
            setSyncProgress(100);
            addSyncLog(`🏁 Hoàn tất đồng bộ! Đã kiểm tra ${stats.checked} phim: Cập nhật ${stats.moviesUpdated} phim (+${stats.newEpisodes} tập mới).`, 'success');
        } catch (err) {
            console.error("Lỗi khi auto-sync tập mới:", err);
            addSyncLog(`❌ Lỗi đồng bộ: ${err.message}`, 'error');
            setSyncStatus('idle');
        }
    };

    const handleStopSync = () => {
        syncAbortRef.current = true;
        setSyncStatus('idle');
    };

    // Background auto cron sync timer
    useEffect(() => {
        if (!autoCronInterval || autoCronInterval <= 0) return;

        const intervalMs = autoCronInterval * 60 * 1000;
        const intervalTimer = setInterval(() => {
            if (syncStatus !== 'running') {
                console.log(`[AutoSync] Đang tự động kiểm tra tập mới (định kỳ mỗi ${autoCronInterval} phút)...`);
                handleStartSync();
            }
        }, intervalMs);

        return () => clearInterval(intervalTimer);
    }, [autoCronInterval, syncStatus, existingMovies, existingEpisodes]);

    return (
        <div className='p-6 min-h-screen text-white'>
            {/* ======= TOP-LEVEL TAB SWITCHER & DEDUPLICATION TOOL ======= */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <button onClick={() => setMainTab('MANUAL')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer
                        ${mainTab === 'MANUAL' ? 'bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-slate-800/60 text-gray-400 hover:text-white hover:bg-slate-700/60 border border-white/10'}`}>
                        <FaMagic /> Manual Import
                    </button>
                    <button onClick={() => setMainTab('CRAWLER')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer
                        ${mainTab === 'CRAWLER' ? 'bg-linear-to-r from-orange-500 to-red-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-slate-800/60 text-gray-400 hover:text-white hover:bg-slate-700/60 border border-white/10'}`}>
                        <FaSpider /> KKPhim Crawler
                    </button>
                    <button onClick={() => setMainTab('SYNC')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer
                        ${mainTab === 'SYNC' ? 'bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-800/60 text-gray-400 hover:text-white hover:bg-slate-700/60 border border-white/10'}`}>
                        <FaSyncAlt className={syncStatus === 'running' ? 'animate-spin' : ''} /> Auto-Sync Tập Mới
                        {autoCronInterval > 0 && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title={`Tự động quét mỗi ${autoCronInterval} phút`} />
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {dedupMsg && (
                        <span className="text-xs font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-3 py-1.5 rounded-lg animate-pulse">
                            {dedupMsg}
                        </span>
                    )}
                    <button
                        onClick={handleDeduplicateMovies}
                        disabled={isDeduplicating}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border border-red-500/40 shadow-xs active:scale-95 disabled:opacity-50"
                        title="Quét và xóa tự động các phim bị trùng lặp tên/slug"
                    >
                        <FaBroom className={isDeduplicating ? "animate-spin" : ""} />
                        <span>{isDeduplicating ? "Đang lọc trùng..." : "Lọc & Xóa phim trùng lặp"}</span>
                    </button>
                </div>
            </div>

            {mainTab === 'CRAWLER' ? (
            /* ==================== CRAWLER UI ==================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Controls */}
                <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
                    <div className='table-wrapper' style={{ background: 'linear-gradient(120deg, rgba(249, 115, 22, 0.25), rgba(239, 68, 68, 0.25))', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>
                        <div className='table-container p-5' style={{ background: 'rgba(15, 23, 42, 0.92)' }}>
                            <h2 className='text-orange-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2'>
                                <FaGlobe className="text-xl" /> KKPhim Auto Crawler
                            </h2>

                            {/* Page Range */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Trang bắt đầu</label>
                                    <input type="number" min="1" value={crawlPageStart} onChange={e => setCrawlPageStart(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Trang kết thúc</label>
                                    <input type="number" min="1" value={crawlPageEnd} onChange={e => setCrawlPageEnd(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400" />
                                </div>
                            </div>

                            {/* Delay */}
                            <div className="mb-4">
                                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Delay giữa các trang (ms)</label>
                                <input type="number" min="500" step="100" value={crawlDelay} onChange={e => setCrawlDelay(Math.max(500, parseInt(e.target.value) || 1500))}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400" />
                                <p className="text-[10px] text-gray-600 mt-1">Khuyến nghị: 1500ms. Thấp hơn 500ms có thể bị API chặn.</p>
                            </div>

                            {/* Info */}
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-4">
                                <p className="text-[11px] text-orange-300">📌 Mỗi trang có ~24 phim. Crawl {crawlPageEnd - crawlPageStart + 1} trang ≈ <span className="font-bold text-white">{(crawlPageEnd - crawlPageStart + 1) * 24}</span> phim.</p>
                                <p className="text-[11px] text-orange-300 mt-1">⏱️ Thời gian ước tính: ~<span className="font-bold text-white">{Math.round(((crawlPageEnd - crawlPageStart + 1) * 24 * (crawlDelay / 2 + 300) + (crawlPageEnd - crawlPageStart + 1) * crawlDelay) / 60000)}</span> phút.</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                                {crawlStatus === 'idle' || crawlStatus === 'done' ? (
                                    <button onClick={handleStartCrawl}
                                        className="w-full py-3 rounded-xl bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all">
                                        <FaPlay /> Bắt đầu Crawl
                                    </button>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={handlePauseCrawl}
                                            className={`py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all
                                            ${crawlStatus === 'paused' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}>
                                            {crawlStatus === 'paused' ? <><FaPlay /> Tiếp tục</> : <><FaPause /> Tạm dừng</>}
                                        </button>
                                        <button onClick={handleStopCrawl}
                                            className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all">
                                            <FaStop /> Dừng hẳn
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className='table-wrapper' style={{ background: 'linear-gradient(120deg, rgba(249, 115, 22, 0.25), rgba(239, 68, 68, 0.25))', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>
                        <div className='table-container p-5' style={{ background: 'rgba(15, 23, 42, 0.92)' }}>
                            <h2 className='text-orange-400 font-bold mb-3 uppercase tracking-wider text-sm flex items-center gap-2'>
                                <FaDatabase className="text-lg" /> Thống kê
                            </h2>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2.5 text-center">
                                    <p className="text-cyan-400 font-black text-lg">{crawlStats.movies}</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Phim đã lưu</p>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-center">
                                    <p className="text-emerald-400 font-black text-lg">{crawlStats.episodes}</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Tập phim</p>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5 text-center">
                                    <p className="text-purple-400 font-black text-lg">{crawlStats.categories}</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Thể loại mới</p>
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 text-center">
                                    <p className="text-blue-400 font-black text-lg">{crawlStats.actors}</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Diễn viên mới</p>
                                </div>
                                <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-2.5 text-center">
                                    <p className="text-pink-400 font-black text-lg">{crawlStats.directors}</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Đạo diễn mới</p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-center">
                                    <p className="text-red-400 font-black text-lg">{crawlStats.errors}</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Lỗi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Logs */}
                <div className="col-span-1 lg:col-span-8 flex flex-col gap-4">
                    <div className='table-wrapper h-full' style={{ background: 'linear-gradient(120deg, rgba(249, 115, 22, 0.25), rgba(239, 68, 68, 0.25))', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>
                        <div className='table-container p-5 h-full flex flex-col' style={{ background: 'rgba(15, 23, 42, 0.92)' }}>
                            <h2 className='text-orange-400 font-bold mb-3 uppercase tracking-wider text-sm flex items-center justify-between'>
                                <span className="flex items-center gap-2">📋 Live Logs</span>
                                <span className={`px-3 py-1 rounded-full text-xs border transition-all
                                    ${crawlStatus === 'running' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse' :
                                      crawlStatus === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                      crawlStatus === 'done' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                      'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                    {crawlStatus === 'running' ? '🟢 Đang chạy' : crawlStatus === 'paused' ? '🟡 Tạm dừng' : crawlStatus === 'done' ? '🔵 Hoàn tất' : '⚪ Chờ lệnh'}
                                </span>
                            </h2>

                            {/* Progress Bar */}
                            {crawlStatus !== 'idle' && (
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs font-bold text-orange-400 mb-1">
                                        <span>{crawlStatus === 'running' ? '⏳ Đang crawl...' : crawlStatus === 'paused' ? '⏸️ Tạm dừng' : '✅ Hoàn tất'}</span>
                                        <span>{crawlProgress}%</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/10">
                                        <div className="bg-linear-to-r from-orange-400 via-red-500 to-pink-500 h-full rounded-full transition-[width] duration-500 ease-out"
                                            style={{ width: `${crawlProgress}%` }} />
                                    </div>
                                </div>
                            )}

                            {/* Log Area */}
                            <div className="flex-1 bg-black/30 border border-white/10 rounded-xl overflow-hidden">
                                <div className="h-[500px] overflow-y-auto custom-scrollbar p-3 font-mono text-xs space-y-1">
                                    {crawlLogs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50">
                                            <FaSpider className="text-5xl mb-3" />
                                            <p>Nhấn "Bắt đầu Crawl" để bắt đầu thu thập dữ liệu từ KKPhim...</p>
                                        </div>
                                    ) : (
                                        crawlLogs.map((log, idx) => (
                                            <div key={idx} className={`py-1 px-2 rounded transition-all
                                                ${log.type === 'error' ? 'text-red-400 bg-red-500/5' :
                                                  log.type === 'success' ? 'text-emerald-400 bg-emerald-500/5' :
                                                  log.type === 'warning' ? 'text-yellow-400 bg-yellow-500/5' :
                                                  'text-gray-400'}`}>
                                                <span className="text-gray-600 mr-2">[{log.time}]</span>{log.message}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ) : mainTab === 'SYNC' ? (
            /* ==================== AUTO-SYNC EPISODES UI ==================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Controls & Settings */}
                <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
                    <div className='table-wrapper' style={{ background: 'linear-gradient(120deg, rgba(16, 185, 129, 0.25), rgba(20, 184, 166, 0.25))', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>
                        <div className='table-container p-5' style={{ background: 'rgba(15, 23, 42, 0.92)' }}>
                            <h2 className='text-emerald-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2'>
                                <FaSyncAlt className={`text-xl ${syncStatus === 'running' ? 'animate-spin' : ''}`} /> Auto-Sync Tập Mới
                            </h2>

                            {/* Scope of sync */}
                            <div className="mb-4">
                                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Số trang quét (Phim Mới Cập Nhật)</label>
                                <select
                                    value={syncPages}
                                    onChange={e => setSyncPages(Number(e.target.value))}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                                >
                                    <option value={1} className="bg-slate-900">1 Trang (~24 phim mới nhất)</option>
                                    <option value={2} className="bg-slate-900">2 Trang (~48 phim mới nhất)</option>
                                    <option value={3} className="bg-slate-900">3 Trang (~72 phim mới nhất - Khuyến nghị)</option>
                                    <option value={5} className="bg-slate-900">5 Trang (~120 phim mới nhất)</option>
                                </select>
                            </div>

                            {/* Auto Cron Background Timer */}
                            <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                        <FaClock className="text-sm" /> Tự động quét ngầm định kỳ
                                    </label>
                                    {autoCronInterval > 0 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            Đang bật
                                        </span>
                                    )}
                                </div>
                                <select
                                    value={autoCronInterval}
                                    onChange={e => handleSetAutoCron(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                                >
                                    <option value={0} className="bg-slate-900">Tắt (Chỉ quét khi bấm nút)</option>
                                    <option value={15} className="bg-slate-900">Mỗi 15 phút (Cập nhật siêu tốc)</option>
                                    <option value={30} className="bg-slate-900">Mỗi 30 phút (Khuyến nghị)</option>
                                    <option value={60} className="bg-slate-900">Mỗi 60 phút (1 tiếng)</option>
                                </select>
                                <p className="text-[10px] text-gray-400 mt-2">
                                    Khi bật, hệ thống sẽ tự động định kỳ quét KKPhim và chèn các tập mới nhất vào phim mà không cần thao tác tay.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 mb-4">
                                {syncStatus !== 'running' ? (
                                    <button
                                        onClick={handleStartSync}
                                        className="w-full py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
                                    >
                                        <FaPlay /> Quét & Cập nhật tập mới ngay
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStopSync}
                                        className="w-full py-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                                    >
                                        <FaStop /> Dừng đồng bộ
                                    </button>
                                )}
                            </div>

                            {/* Last Sync Info */}
                            {lastSyncTime && (
                                <div className="text-[11px] text-gray-400 flex items-center justify-between border-t border-white/5 pt-3">
                                    <span>Lần cập nhật gần nhất:</span>
                                    <span className="font-semibold text-emerald-300">{lastSyncTime}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Live Monitor & Logs */}
                <div className="col-span-1 lg:col-span-8 flex flex-col gap-4">
                    <div className='table-wrapper' style={{ background: 'linear-gradient(120deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>
                        <div className='table-container p-5 flex flex-col h-full' style={{ background: 'rgba(15, 23, 42, 0.92)' }}>
                            {/* Stats Counters */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-gray-200">{syncStats.checked}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Phim đã quét</div>
                                </div>
                                <div className="bg-black/30 border border-emerald-500/30 rounded-xl p-3 text-center bg-emerald-500/5">
                                    <div className="text-xl font-bold text-emerald-400">{syncStats.moviesUpdated}</div>
                                    <div className="text-[10px] text-emerald-300 uppercase tracking-wider mt-0.5">Phim có tập mới</div>
                                </div>
                                <div className="bg-black/30 border border-teal-500/30 rounded-xl p-3 text-center bg-teal-500/5">
                                    <div className="text-xl font-bold text-teal-400">{syncStats.newEpisodes}</div>
                                    <div className="text-[10px] text-teal-300 uppercase tracking-wider mt-0.5">Tập mới đã thêm</div>
                                </div>
                                <div className="bg-black/30 border border-red-500/30 rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-red-400">{syncStats.errors}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Lỗi</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {syncStatus === 'running' && (
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs font-bold text-emerald-400 mb-1">
                                        <span>⏳ Đang đồng bộ tập mới...</span>
                                        <span>{syncProgress}%</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/10">
                                        <div className="bg-linear-to-r from-emerald-400 via-teal-500 to-cyan-500 h-full rounded-full transition-[width] duration-500 ease-out"
                                            style={{ width: `${syncProgress}%` }} />
                                    </div>
                                </div>
                            )}

                            {/* Log Console */}
                            <div className="flex-1 bg-black/30 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10 text-xs font-bold text-gray-300">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        Nhật ký Đồng bộ (Live Sync Log)
                                    </span>
                                    {syncLogs.length > 0 && (
                                        <button
                                            onClick={() => setSyncLogs([])}
                                            className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 cursor-pointer"
                                        >
                                            Xóa log
                                        </button>
                                    )}
                                </div>
                                <div className="h-[450px] overflow-y-auto custom-scrollbar p-3 font-mono text-xs space-y-1">
                                    {syncLogs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                                            <FaSyncAlt className="text-4xl mb-3 text-emerald-400 opacity-40" />
                                            <p className="text-center">Bấm "Quét & Cập nhật tập mới ngay" hoặc bật chế độ tự động ngầm để bắt đầu.</p>
                                        </div>
                                    ) : (
                                        syncLogs.map((log, idx) => (
                                            <div key={idx} className={`py-1 px-2 rounded transition-all
                                                ${log.type === 'error' ? 'text-red-400 bg-red-500/5' :
                                                  log.type === 'success' ? 'text-emerald-400 bg-emerald-500/10 font-semibold' :
                                                  log.type === 'warning' ? 'text-yellow-400 bg-yellow-500/5' :
                                                  'text-gray-400'}`}>
                                                <span className="text-gray-600 mr-2">[{log.time}]</span>{log.message}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ) : (
            /* ==================== MANUAL IMPORT UI (existing) ==================== */
            <>
            <div className='magic-header flex items-center justify-between gap-4 mb-6 py-3 px-5 rounded-2xl'>
                <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-linear-to-br from-cyan-400 to-purple-500 flex justify-center items-center shadow-[0_0_15px_rgba(34,211,238,0.5)]'>
                        <FaMagic className='text-2xl text-white' />
                    </div>
                    <div>
                        <h1 className='text-2xl font-black tracking-wide glow-text uppercase'>Magic Import</h1>
                        <p className='text-gray-400 text-xs mt-0.5'>Copy table from Excel to automatically sync Movies, Episodes & Showtimes.</p>
                    </div>
                </div>

                {/* CLEAR BUTTON */}
                <div className='flex items-center gap-4'>
                    <button
                        onClick={handleClearAll}
                        title="Clear all inputs and tables"
                        className="flex hover:scale-105 cursor-pointer items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95"
                    >
                        <FaEraser className="text-sm" />
                        <p className="text-xs font-bold uppercase tracking-wider hidden sm:block">Clear</p>
                    </button>

                    {/* AI PROMPT CONTROL BAR */}
                    <div className='flex items-stretch rounded-xl overflow-hidden'
                        style={{
                            background: 'rgba(10, 15, 25, 0.6)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0, 242, 254, 0.2)',
                            boxShadow: '0 0 8px rgba(0, 242, 254, 0.15), 0 0 20px rgba(139, 92, 246, 0.08), inset 0 0 12px rgba(0, 242, 254, 0.03)',
                        }}
                    >
                        {/* AI PROMPT LABEL */}
                        <div className='flex items-center gap-2 px-3'>
                            <FaRobot className="text-pink-400 text-xl" />
                            <p className="text-xs font-bold text-pink-300 uppercase tracking-wider hidden xl:block whitespace-nowrap">AI Prompt</p>
                        </div>

                        {/* SEPARATOR */}
                        <div className="w-px self-stretch my-1.5 bg-white/10"></div>

                        {/* COUNT INPUT */}
                        <div className='flex items-center gap-1.5 px-2'>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">SL</p>
                            <input
                                type="number"
                                className="w-12 bg-transparent border-none p-2.5 text-xs text-center text-gray-300 focus:outline-none focus:bg-white/5 transition-all"
                                placeholder="Số lượng"
                                value={promptCount}
                                onChange={(e) => setPromptCount(e.target.value)}
                            />
                        </div>

                        {/* SEPARATOR */}
                        <div className="w-px self-stretch my-1.5 bg-white/10"></div>

                        {/* THEME INPUT */}
                        <input
                            type="text"
                            className="w-44 lg:w-56 bg-transparent border-none p-2.5 text-xs text-gray-300 focus:outline-none focus:bg-white/5 transition-all"
                            placeholder="Nhập thể loại (VD: Marvel, Anime...)"
                            value={promptTheme}
                            onChange={(e) => setPromptTheme(e.target.value)}
                        />

                        {/* SEPARATOR */}
                        <div className="w-px self-stretch my-1.5 bg-white/10"></div>

                        {/* COPY BUTTON */}
                        <button
                            onClick={handleCopyPrompt}
                            className={`px-4 py-2.5 cursor-pointer hover:scale-105 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-95 ${isCopied ? 'bg-emerald-600/80' : 'bg-pink-600/80 hover:bg-pink-500/80'}`}
                        >
                            {isCopied ? (
                                <>
                                    <FaCheckCircle className="text-sm" /> Copied!
                                </>
                            ) : (
                                <>
                                    <FaCopy className="text-sm" /> Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
                <div className='col-span-1 lg:col-span-4 flex flex-col gap-4'>
                    <div className='table-wrapper' style={{ background: 'linear-gradient(120deg, rgba(0, 255, 255, 0.25), rgba(139, 92, 246, 0.25))', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.08)' }}>
                        <div className='table-container p-5 relative group transition-all' style={{ background: 'rgba(15, 23, 42, 0.92)' }}>

                            <div className="flex bg-slate-800/50 rounded-xl p-1 mb-5 border border-white/10 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-600/60 p-2 flex justify-center items-center rounded-full z-10">
                                    <FaExchangeAlt className="text-yellow-300 text-xs " />
                                </div>
                                <button
                                    onClick={() => setMode('IMPORT')}
                                    className={`flex-1 py-2.5 hover:scale-105 cursor-pointer rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 z-0
                                    ${mode === 'IMPORT' ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    Import Only
                                </button>
                                <button
                                    onClick={() => setMode('UPDATE')}
                                    className={`flex-1 py-2.5 hover:scale-105 cursor-pointer rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 z-0
                                    ${mode === 'UPDATE' ? 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    Smart Update
                                </button>
                            </div>

                            <h2 className='text-cyan-400 font-bold mb-3 uppercase tracking-wider text-sm flex items-center gap-2'>
                                <FaCloudUploadAlt className="text-xl" /> Data Input Area
                            </h2>
                            <textarea
                                className='w-full h-56 bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-gray-300 font-mono focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] custom-scrollbar'
                                placeholder='Paste data table here...'
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />

                            <div className="flex flex-col gap-3 mt-4">
                                {errorMsg && (
                                    <div className="text-red-400 bg-red-500/10 border border-red-500/30 p-2.5 rounded-lg text-xs font-bold text-center shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                        {errorMsg}
                                    </div>
                                )}

                                <button
                                    onClick={handleParse}
                                    className={`w-full cursor-pointer hover:scale-105 py-3 rounded-xl text-white font-bold tracking-wider uppercase transition-all active:scale-95
                                    ${mode === 'IMPORT' ? 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.4)]' : 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(192,38,211,0.4)]'}`}
                                >
                                    Parse Data ({mode})
                                </button>

                                <label className='w-full  hover:scale-105 py-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wider uppercase transition-all cursor-pointer shadow-[0_0_15px_rgba(5,150,105,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-95'>
                                    <FaFileExcel className="text-xl" /> Upload Excel
                                    <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='col-span-1 lg:col-span-8 flex flex-col gap-4'>
                    <div className='table-wrapper h-full' style={{ background: 'linear-gradient(120deg, rgba(0, 255, 255, 0.25), rgba(139, 92, 246, 0.25))', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.08)' }}>
                        <div className='table-container p-5 h-full flex flex-col justify-between transition-all duration-300' style={{ background: 'rgba(15, 23, 42, 0.92)' }}>
                            <div>
                                <h2 className={`font-bold mb-3 uppercase tracking-wider text-sm flex items-center justify-between transition-colors
                                ${mode === 'IMPORT' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                                    <p className="inline">Preview Table ({mode === 'UPDATE' ? 'Update Mode' : 'Import Mode'})</p>
                                    <p className={`px-3 py-1 rounded-full text-xs border transition-colors
                                    ${mode === 'IMPORT' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'} inline`}>
                                        {previewData.length} items
                                    </p>
                                </h2>

                                <div className='border border-white/10 rounded-xl overflow-hidden mt-4'>
                                    <div className='h-72 flex flex-col relative'>
                                        {previewData.length > 0 ? (
                                            <div className='overflow-auto h-full custom-scrollbar'>
                                                <table className='w-full whitespace-nowrap text-xs min-w-max text-left border-collapse'>
                                                    <thead className='table-header border-b border-white/20 sticky top-0 z-10'>
                                                        <tr>
                                                            <th className='p-3 text-center align-middle'>STT</th>
                                                            <th className='p-3 text-center align-middle'>ACTION</th>
                                                            <th className='p-3 text-center align-middle'>NAME (INTL / SELECT)</th>
                                                            <th className='p-3 text-center align-middle'>NAME (VN)</th>
                                                            <th className='p-3 text-center align-middle'>MOVIE DESC</th>
                                                            <th className='p-3 text-center align-middle'>TYPE</th>
                                                            <th className='p-3 text-center align-middle'>CATEGORIES</th>
                                                            <th className='p-3 text-center align-middle'>CAT DESC</th>
                                                            <th className='p-3 text-center align-middle'>DIRECTOR</th>
                                                            <th className='p-3 text-center align-middle'>DIR DESC</th>
                                                            <th className='p-3 text-center align-middle'>ACTORS</th>
                                                            <th className='p-3 text-center align-middle'>ACTOR DESC</th>
                                                            <th className='p-3 text-center align-middle'>CHARACTERS</th>
                                                            <th className='p-3 text-center align-middle'>CHAR DESC</th>
                                                            <th className='p-3 text-center align-middle'>GENDER</th>
                                                            <th className='p-3 text-center align-middle'>CHAR GENDER</th>
                                                            <th className='p-3 text-center align-middle'>INFO (YEAR/AGE/PLAN)</th>
                                                            <th className='p-3 text-center align-middle'>DURATION</th>
                                                            <th className='p-3 text-center align-middle'>RENT PRICE</th>
                                                            <th className='p-3 text-center align-middle'>COUNTRY</th>
                                                            <th className='p-3 text-center align-middle'>EPISODES</th>
                                                            <th className='p-3 text-center align-middle'>EP DATA (NUM/URL)</th>
                                                            <th className='p-3 text-center align-middle'>SHOWTIME (ROOM/TIME)</th>
                                                            <th className='p-3 text-center align-middle'>STATUS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {previewData.map((row, idx) => {
                                                            const isDuplicated = existingMovies.some(m => m?.name && row?.name && m.name.toLowerCase() === row.name.toLowerCase());

                                                            let rowClass = "border-b border-white/5 transition-all duration-300 text-gray-200 ";
                                                            if (rowStatuses[idx] === 'processing') {
                                                                rowClass += "bg-cyan-500/15 border-l-4 border-l-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-pulse text-cyan-300";
                                                            } else if (rowStatuses[idx] === 'success') {
                                                                rowClass += "bg-emerald-500/15 border-l-4 border-l-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                                                            } else if (isDuplicated) {
                                                                rowClass += mode === 'UPDATE' ? 'bg-fuchsia-500/10 hover:bg-fuchsia-500/20' : 'bg-indigo-500/10 hover:bg-indigo-500/20';
                                                            } else {
                                                                rowClass += "hover:bg-white/5";
                                                            }

                                                            return (
                                                                <tr key={idx} className={rowClass}>
                                                                    <td className='p-3 text-center align-middle font-bold text-gray-400'>
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className='p-3 text-center align-middle'>
                                                                        <button onClick={() => handleRemoveRow(idx)} className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Remove row"><FaTrash size={14} /></button>
                                                                    </td>

                                                                    <td className='p-3 text-center align-middle font-bold text-cyan-300 min-w-45'>
                                                                        <div className="flex flex-col gap-1">
                                                                            <p className="inline">{row.name}</p>
                                                                            {mode === 'UPDATE' && (
                                                                                <select
                                                                                    value={row.matchedMovieId || ""}
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        setPreviewData(prev => prev.map((item, i) => i === idx ? { ...item, matchedMovieId: val } : item));
                                                                                    }}
                                                                                    className="bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 w-full font-sans cursor-pointer mt-1"
                                                                                >
                                                                                    <option value="">-- Manual Link Select --</option>
                                                                                    {existingMovies.map(m => (
                                                                                        <option key={m.id} value={m.id} className="bg-slate-800 text-gray-200 py-1">{m.name}</option>
                                                                                    ))}
                                                                                </select>
                                                                            )}
                                                                            {rowStatuses[idx] === 'processing' && <div className="text-[10px] text-cyan-400 font-normal mt-1">Syncing Data...</div>}
                                                                            {rowStatuses[idx] === 'success' && <div className="text-[10px] text-emerald-400 font-bold mt-1">✓ Completed</div>}
                                                                            {!rowStatuses[idx] && isDuplicated && (
                                                                                mode === 'UPDATE' ? (
                                                                                    <div className="text-[9px] bg-fuchsia-500 text-white px-1.5 py-0.5 rounded uppercase inline-block mx-auto mt-1">Will Update</div>
                                                                                ) : (
                                                                                    <div className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase inline-block mx-auto mt-1">Append Eps</div>
                                                                                )
                                                                            )}
                                                                            {!rowStatuses[idx] && !isDuplicated && <div className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase inline-block mx-auto mt-1">Create New</div>}
                                                                        </div>
                                                                    </td>

                                                                    <td className='p-3 text-center align-middle text-emerald-300 font-semibold'>{row.otherName}</td>
                                                                    <td className='p-3 text-center align-middle text-gray-300 truncate max-w-40' title={row.description}>{row.description}</td>
                                                                    <td className='p-3 text-center align-middle text-purple-300'>{row.rawCategoryType}</td>
                                                                    <td className='p-3 text-center align-middle text-pink-300'>{row.rawCategories}</td>
                                                                    <td className='p-3 text-center align-middle text-pink-200 truncate max-w-40' title={row.rawCategoryDesc}>{row.rawCategoryDesc}</td>
                                                                    <td className='p-3 text-center align-middle text-green-300'>{row.rawAuthor}</td>
                                                                    <td className='p-3 text-center align-middle text-green-200 truncate max-w-40' title={row.rawAuthorDesc}>{row.rawAuthorDesc}</td>
                                                                    <td className='p-3 text-center align-middle text-blue-300 truncate max-w-30' title={row.rawActors}>{row.rawActors}</td>
                                                                    <td className='p-3 text-center align-middle text-blue-200 truncate max-w-40' title={row.rawActorDesc}>{row.rawActorDesc}</td>
                                                                    <td className='p-3 text-center align-middle text-orange-300 truncate max-w-30' title={row.rawCharacters}>{row.rawCharacters}</td>
                                                                    <td className='p-3 text-center align-middle text-orange-200 truncate max-w-40' title={row.rawCharacterDesc}>{row.rawCharacterDesc}</td>
                                                                    <td className='p-3 text-center align-middle text-pink-300 truncate max-w-20' title={row.gender}>{row.gender}</td>
                                                                    <td className='p-3 text-center align-middle text-pink-300 truncate max-w-20' title={row.charGender}>{row.charGender}</td>
                                                                    <td className='p-3 text-center align-middle'>
                                                                        <div className="flex flex-col gap-1 items-center">
                                                                            <p className="text-yellow-400 font-bold inline">{row.releaseYear}</p>
                                                                            <p className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold inline">{row.ageRating}</p>
                                                                            <p className="bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold inline">{row.rawPlan || "Free"}</p>
                                                                        </div>
                                                                    </td>
                                                                    <td className='p-3 text-center align-middle font-mono'>{row.duration}m</td>
                                                                    <td className='p-3 text-center align-middle font-mono text-green-400'>{row.rent.toLocaleString()}</td>
                                                                    <td className='p-3 text-center align-middle'><p className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded text-[11px] font-bold inline">{row.countriesID}</p></td>
                                                                    <td className='p-3 text-center align-middle'>
                                                                        <div className="flex flex-col gap-1 items-center bg-purple-500/10 border border-purple-500/20 p-1.5 rounded-lg">
                                                                            <p className="text-purple-300 font-bold text-[13px] inline">Total: {row.endEpisode}</p>
                                                                            <p className="text-[10px] text-purple-400 inline">S:{row.episodeSub} | D:{row.episodeDub}</p>
                                                                        </div>
                                                                    </td>
                                                                    <td className='p-3 text-center align-middle'>
                                                                        <div className="flex flex-col gap-1 items-center">
                                                                            {row.epNumber ? <p className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold inline">Ep: {row.epNumber}</p> : <p className="text-gray-500 text-[10px] inline">-</p>}
                                                                            {row.epUrl ? <p className="text-blue-400 text-[10px] truncate w-16 inline" title={row.epUrl}>URL OK</p> : <p className="text-gray-500 text-[10px] inline">-</p>}
                                                                        </div>
                                                                    </td>
                                                                    <td className='p-3 text-center align-middle'>
                                                                        <div className="flex flex-col gap-1 items-center">
                                                                            {row.roomName ? <p className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-bold inline">{row.roomName}</p> : <p className="text-gray-500 text-[10px] inline">-</p>}
                                                                            {row.rawShowtimes ? <p className="text-cyan-200 text-[10px] truncate w-16 inline" title={row.rawShowtimes}>{row.rawShowtimes}</p> : <p className="text-gray-500 text-[10px] inline">-</p>}
                                                                        </div>
                                                                    </td>
                                                                    <td className='p-3 text-center align-middle'>
                                                                        <p className={`px-2 py-1 rounded text-[11px] font-bold border ${getStatusStyle(row.status)} inline`}>{row.status}</p>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className='absolute inset-0 flex flex-col items-center justify-center text-gray-500 opacity-50'>
                                                <FaMagic className='text-5xl mb-3' />
                                                <p>Data will appear here after parsing</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-4">
                                {loading && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs font-bold text-cyan-400 mb-1.5 uppercase tracking-wider">
                                            <p className="animate-pulse inline">Syncing Cloud Database...</p>
                                            <p className="inline">{parseFloat(Number(visualProgress).toFixed(2))}%</p>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-3.5 overflow-hidden p-0.5 border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                            <div
                                                className="bg-linear-to-r from-cyan-400 via-fuchsia-500 to-yellow-400 h-full rounded-full transition-[width] duration-1500 ease-out shadow-[0_0_20px_rgba(217,70,239,0.7)]"
                                                style={{ width: `${visualProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {successMsg && (
                                    <div className="mb-3 p-2.5 border rounded-lg flex items-center justify-center gap-2 text-xs font-bold bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                        <FaCheckCircle className="text-base" /> {successMsg}
                                    </div>
                                )}

                                <button
                                    onClick={handleExecuteImport}
                                    disabled={loading || previewData.length === 0}
                                    className={`w-full py-3.5 rounded-xl font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 text-xs text-white
                                    ${previewData.length > 0
                                            ? (mode === 'IMPORT'
                                                ? 'bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer active:scale-[0.98]'
                                                : 'bg-linear-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 shadow-[0_0_15px_rgba(217,70,239,0.4)] cursor-pointer active:scale-[0.98]')
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'}`}
                                >
                                    <FaPlay className="text-xs" /> {loading ? "Syncing..." : `Confirm & Execute Magic (${mode})`}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            </>
            )}
        </div>
    );
}

export default MagicImport;
