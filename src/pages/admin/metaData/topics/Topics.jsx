import React, { useState, useContext } from 'react';
import Search from '../../../../components/admin/search/Search';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { TopicContext } from '../../../../contexts/TopicProvider';
import { addDocument, updateDocument, deleteDocument } from '../../../../services/firebaseService';
import TableTopic from './TableTopic';
import ModalTopic from './ModalTopic';
import Swal from 'sweetalert2';

const inner = { name: "", description: "", movieIds: [], icon: "FaFire", gradient: "from-purple-500 to-indigo-600" };

function Topics(props) {
    const movies = useContext(MovieContext) || [];
    const topicsList = useContext(TopicContext) || [];
    const [open, setOpen] = useState(false);
    const [topic, setTopic] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [search, setSearch] = useState("");
    const onChangeSearch = (e) => {
        setSearch(e.target.value)
    }

    const handleClickOpen = () => {
        setOpen(true);
        setTopic(inner);
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const validation = () => {
        const newError = {};
        newError.title = topic.title ? "" : "Please enter topic title";
        newError.description = topic.description ? "" : "Please enter your description";
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    }

    const addTopic = async () => {
        if (validation()) {
            return;
        }
        setLoading(true);
        setProgress(20);
        try {
            setProgress(50);
            const topicData = {
                ...topic,
                id: topic.id || `topic-${Date.now()}`
            };
            
            !topic.id ? await addDocument("Topics", topicData) : await updateDocument("Topics", topicData);
            setProgress(100);
            setTimeout(() => {
                handleClose();
                setLoading(false);
                setProgress(0);
            }, 500);
        } catch (err) {
            console.error("Error saving topic:", err);
            setLoading(false);
            setProgress(0);
        }
    }

    const onChangeInput = (e) => {
        setTopic({ ...topic, [e.target.name]: e.target.value });
        setError({ ...error, [e.target.name]: "" });
    }

    const onChangeMovieSelection = (selectedIds) => {
        setTopic({ ...topic, movieIds: selectedIds });
    }

    const onEdit = (data) => {
        setTopic(data);
        setOpen(true);
        setError(inner);
    }

    const onDelete = async (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDocument("Topics", id);
                    Swal.fire({
                        title: "Deleted!",
                        text: "Topic has been deleted.",
                        icon: "success"
                    });
                } catch (error) {
                    Swal.fire({
                        title: "Error!",
                        text: "Failed to delete topic.",
                        icon: "error"
                    });
                }
            }
        });
    }

    const handleSeedSmartTopics = async () => {
        const SMART_COLLECTIONS = [
            { id: 'phim-hot', name: 'Phim Hot Nhất', description: 'Những bộ phim đang được xem nhiều nhất tuần qua.', gradient: 'from-orange-500 via-red-500 to-rose-600', isSmart: true, smartId: 'phim-hot', movieIds: [] },
            { id: 'phim-moi', name: 'Phim Mới Cập Nhật', description: 'Những bộ phim vừa được thêm vào hệ thống.', gradient: 'from-amber-400 via-yellow-500 to-orange-500', isSmart: true, smartId: 'phim-moi', movieIds: [] },
            { id: 'anime-hay', name: 'Anime Đặc Sắc', description: 'Thế giới hoạt hình Nhật Bản phong phú.', gradient: 'from-pink-500 via-fuchsia-500 to-purple-600', isSmart: true, smartId: 'anime-hay', movieIds: [] },
            { id: 'phim-bo-dai-tap', name: 'Phim Bộ Dài Tập', description: 'Cày xuyên màn đêm với những series hấp dẫn.', gradient: 'from-purple-500 to-indigo-600', isSmart: true, smartId: 'phim-bo-dai-tap', movieIds: [] },
            { id: 'phim-le', name: 'Phim Lẻ (Điện Ảnh)', description: 'Những tác phẩm điện ảnh xuất sắc gói gọn trong vài giờ.', gradient: 'from-sky-400 via-blue-500 to-indigo-600', isSmart: true, smartId: 'phim-le', movieIds: [] },
            { id: 'phim-han', name: 'Phim Hàn Quốc', description: 'Đậm chất ngôn tình và kịch tính từ màn ảnh xứ Kim Chi.', gradient: 'from-emerald-400 via-teal-500 to-cyan-600', isSmart: true, smartId: 'phim-han', movieIds: [] },
            { id: 'phim-trung', name: 'Phim Trung Quốc', description: 'Cổ trang, tiên hiệp và hiện đại đình đám.', gradient: 'from-lime-400 via-green-500 to-emerald-600', isSmart: true, smartId: 'phim-trung', movieIds: [] },
            { id: 'phim-viet', name: 'Phim Việt Nam', description: 'Phim điện ảnh và truyền hình đặc sắc của Việt Nam.', gradient: 'from-red-500 via-orange-500 to-yellow-500', isSmart: true, smartId: 'phim-viet', movieIds: [] }
        ];

        setLoading(true);
        let addedCount = 0;
        
        try {
            for (const col of SMART_COLLECTIONS) {
                const exists = topicsList.some(t => t.id === col.id || t.smartId === col.smartId);
                if (!exists) {
                    await addDocument("Topics", { ...col, title: col.name });
                    addedCount++;
                }
            }
            

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='w-full'>
            <Search 
                name={"List Topics"} 
                tuKhoa={"Search Topic by Name"} 
                onChangeSearch={onChangeSearch} 
                handleClickOpen={handleClickOpen} 
            />
            
            <div className="px-4 pb-2 flex justify-end">
                 <button 
                     onClick={handleSeedSmartTopics}
                     disabled={loading}
                     className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-white text-sm font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 transition-transform cursor-pointer"
                 >
                     {loading ? 'Đang tạo...' : '✨ Tạo Chủ Đề Tự Động (Auto)'}
                 </button>
            </div>

            <ModalTopic 
                open={open} 
                handleClose={handleClose} 
                topic={topic} 
                error={error} 
                onChangeInput={onChangeInput} 
                addTopic={addTopic} 
                loading={loading}
                progress={progress}
                onChangeMovieSelection={onChangeMovieSelection}
                movies={movies}
            />
            <TableTopic 
                search={search} 
                onEdit={onEdit} 
                onDelete={onDelete} 
            />
        </div>
    );
}

export default Topics;
