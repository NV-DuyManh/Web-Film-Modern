import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, styled, Slide, MenuItem } from '@mui/material';
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);
const VisuallyHiddenInput = styled('input')({ clip: 'rect(0 0 0 0)', height: 1, position: 'absolute', width: 1 });

export default function ModalMovies({ open, handleClose, movie, onChangeInput, addOrUpdateMovie, loading, setMovie, error }) {
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setMovie({ ...movie, imgUrl: reader.result, imgFile: file });
            reader.readAsDataURL(file);
        }
    };

    const handleNumberChange = (e) => {
        const onlyNums = e.target.value.replace(/[^0-9]/g, '');
        onChangeInput({ target: { name: e.target.name, value: onlyNums } });
    };

    const menuProps = {
        PaperProps: { sx: { bgcolor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' } }
    };

    return (
        <Dialog open={open} TransitionComponent={Transition} keepMounted onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ className: "modal-inner" }} BackdropProps={{ className: "modal-backdrop-x" }}>
            <DialogTitle className="modal-header-x">{movie.id ? "UPDATE MOVIE" : "ADD NEW MOVIE"}</DialogTitle>
            <DialogContent className="modal-body-x grid grid-cols-12 gap-8 h-[75vh] overflow-y-auto custom-scrollbar p-8 pt-10">

                <div className="col-span-12 lg:col-span-7 space-y-8 mt-5">
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Task 1: General Info</p>
                        <TextField className="modal-input-x" name="name" onChange={onChangeInput} fullWidth label="Movie Name" value={movie.name} error={!!error.name} helperText={error.name} />
                        <TextField className="modal-input-x" name="description" onChange={onChangeInput} fullWidth multiline rows={3} label="Description" value={movie.description} error={!!error.description} helperText={error.description} />
                    </div>

                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">Task 2: Specification</p>
                        <div className="grid grid-cols-3 gap-4">
                            <TextField className="modal-input-x" name="productionYear" onChange={handleNumberChange} label="Year" value={movie.productionYear} error={!!error.productionYear} helperText={error.productionYear} />
                            <TextField className="modal-input-x" name="duration" onChange={handleNumberChange} label="Duration" value={movie.duration} error={!!error.duration} helperText={error.duration} />
                            <TextField className="modal-input-x" name="endEpisode" onChange={handleNumberChange} label="Episodes" value={movie.endEpisode} error={!!error.endEpisode} helperText={error.endEpisode} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <TextField select className="modal-input-x" name="status" onChange={onChangeInput} label="Status" value={movie.status || "Coming Soon"} SelectProps={{ MenuProps: menuProps }}>
                                <MenuItem value="Coming Soon">Coming Soon</MenuItem>
                                <MenuItem value="Now Showing">Now Showing</MenuItem>
                                <MenuItem value="Ended">Ended</MenuItem>
                            </TextField>
                            <TextField select className="modal-input-x" name="rating" onChange={onChangeInput} label="Rating" value={movie.rating || 5} SelectProps={{ MenuProps: menuProps }}>
                                {[1, 2, 3, 4, 5].map(num => <MenuItem key={num} value={num}>{num} Stars</MenuItem>)}
                            </TextField>
                        </div>
                    </div>

                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Task 3: Media & Classification</p>
                        <TextField className="modal-input-x" name="category_Type_Id" onChange={onChangeInput} fullWidth label="Category Type ID" value={movie.category_Type_Id} error={!!error.category_Type_Id} helperText={error.category_Type_Id} />
                        <TextField className="modal-input-x" name="trailerUrl" onChange={onChangeInput} fullWidth label="Trailer URL" value={movie.trailerUrl} error={!!error.trailerUrl} helperText={error.trailerUrl} />
                        <TextField className="modal-input-x" name="list_Category" onChange={onChangeInput} fullWidth label="List Category" value={movie.list_Category} error={!!error.list_Category} helperText={error.list_Category} />
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-8 mt-5">
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 flex flex-col items-center">
                        <p className="text-pink-400 text-xs font-bold uppercase tracking-widest text-center mb-4">Movie Poster</p>
                        <div className="relative w-48 aspect-2/3 rounded-2xl overflow-hidden border-2 border-dashed border-slate-600 group bg-slate-900/50 flex items-center justify-center transition-all hover:border-pink-400">
                            <img src={movie.imgUrl} className="w-full h-full object-cover group-hover:opacity-20 transition-all" alt="Poster" />
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                                <FaCloudUploadAlt className="text-5xl text-pink-400 mb-2" />
                                <span className="text-white text-sm font-bold">Upload</span>
                                <VisuallyHiddenInput type="file" onChange={handleImageChange} accept="image/*" />
                            </label>
                        </div>
                    </div>

                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Task 4: Cast & Billing</p>
                        <TextField className="modal-input-x" name="list_Actor" onChange={onChangeInput} fullWidth label="List Actor" value={movie.list_Actor} error={!!error.list_Actor} helperText={error.list_Actor} />
                        <TextField className="modal-input-x" name="list_Character" onChange={onChangeInput} fullWidth label="List Character" value={movie.list_Character} error={!!error.list_Character} helperText={error.list_Character} />
                        <div className="grid grid-cols-2 gap-4">
                            <TextField className="modal-input-x" name="rent" onChange={handleNumberChange} label="Rent Price" value={movie.rent} error={!!error.rent} helperText={error.rent} />
                            <TextField className="modal-input-x" name="planID" onChange={onChangeInput} label="Plan ID" value={movie.planID} error={!!error.planID} helperText={error.planID} />
                        </div>
                    </div>
                </div>
            </DialogContent>
            <DialogActions className="modal-actions-x p-6">
                <Button onClick={handleClose} className="btn-cancel-x">Cancel</Button>
                <Button onClick={addOrUpdateMovie} disabled={loading} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin" /> : "Save Movie"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}