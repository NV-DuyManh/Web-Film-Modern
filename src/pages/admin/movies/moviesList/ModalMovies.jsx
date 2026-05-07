import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, styled } from '@mui/material';
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';

const VisuallyHiddenInput = styled('input')({ clip: 'rect(0 0 0 0)', height: 1, position: 'absolute', width: 1 });

export default function ModalMovies({ open, handleClose, movie, onChangeInput, addOrUpdateMovie, loading, setMovie }) {
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setMovie({ ...movie, imgUrl: reader.result, imgFile: file });
            reader.readAsDataURL(file);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ className: "modal-inner" }}>
            <DialogTitle className="modal-header-x">{movie.id ? "CẬP NHẬT PHIM" : "THÊM PHIM MỚI"}</DialogTitle>
            <DialogContent className="modal-body-x grid grid-cols-2 gap-6 p-6 h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                    <TextField label="Tên phim" name="name" fullWidth onChange={onChangeInput} value={movie.name} variant="outlined" className="modal-input-x" />
                    <TextField label="Mô tả" name="description" fullWidth multiline rows={4} onChange={onChangeInput} value={movie.description} className="modal-input-x" />
                    <div className="flex gap-4">
                        <TextField label="Năm" name="productionYear" type="number" fullWidth onChange={onChangeInput} value={movie.productionYear} className="modal-input-x" />
                        <TextField label="Thời lượng" name="duration" type="number" fullWidth onChange={onChangeInput} value={movie.duration} className="modal-input-x" />
                    </div>
                    <div className="upload-container !mt-4">
                        <div className="relative w-32 h-44 rounded-lg overflow-hidden border-2 border-dashed border-gray-600 group">
                            <img src={movie.imgUrl} className="w-full h-full object-cover group-hover:opacity-30" alt="Preview" />
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                <FaCloudUploadAlt className="text-2xl text-cyan-400" />
                                <VisuallyHiddenInput type="file" onChange={handleImageChange} accept="image/*" />
                            </label>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <TextField label="Trailer URL" name="trailerUrl" fullWidth onChange={onChangeInput} value={movie.trailerUrl} className="modal-input-x" />
                    <TextField label="Danh sách diễn viên" name="list_Actor" fullWidth onChange={onChangeInput} value={movie.list_Actor} className="modal-input-x" />
                    <TextField label="Danh sách thể loại" name="list_Category" fullWidth onChange={onChangeInput} value={movie.list_Category} className="modal-input-x" />
                    <div className="flex gap-4">
                        <TextField label="Giá thuê" name="rent" type="number" fullWidth onChange={onChangeInput} value={movie.rent} className="modal-input-x" />
                        <TextField label="Xếp hạng" name="rating" type="number" fullWidth onChange={onChangeInput} value={movie.rating} className="modal-input-x" />
                    </div>
                    <TextField label="Trạng thái" name="status" fullWidth onChange={onChangeInput} value={movie.status} className="modal-input-x" />
                </div>
            </DialogContent>
            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">Hủy</Button>
                <Button onClick={addOrUpdateMovie} disabled={loading} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin" /> : "LƯU DỮ LIỆU"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}