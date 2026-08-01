import { FaTimes } from 'react-icons/fa';
import React, { useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, Autocomplete, Rating } from '@mui/material';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { UserContext } from '../../../../contexts/UserProvider';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalReview({ open, onChangeInput, handleClose, addReview, error, loading, progress, review, setReview, setError }) {
    const movies = useContext(MovieContext);
    const users = useContext(UserContext);

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleClose}
            className="modal-wrapper"
            PaperProps={{ className: "modal-inner" }}
            BackdropProps={{ className: "modal-backdrop-x" }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle className="modal-header-x flex justify-between items-center">
                <p className="glow-text-gold text-xl md:text-2xl font-black tracking-tight inline" style={{ paddingBottom: '0.1em' }}>
                    {review.id  ? "Update Review" : "Add New Review"}
                </p>
                <button 
                    onClick={handleClose}
                    className="w-8 h-8 shrink-0 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] hover:scale-110 transition-all duration-300 group cursor-pointer"
                >
                    <FaTimes size={16} className="transition-transform duration-200 group-hover:rotate-180 group-hover:scale-125" style={{ strokeWidth: '1.5', stroke: 'currentColor' }} />
                </button>
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <Autocomplete
                    className="modal-input-x"
                    disablePortal
                    options={movies || []}
                    getOptionLabel={(option) => option.name || ""}
                    fullWidth
                    classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                    value={movies?.find(m => m.id === review.movieID) || null}
                    onChange={(e, value) => {
                        setReview(prev => ({ ...prev, movieID: value ? value.id : "" }));
                        setError(prev => ({ ...prev, movieID: "" }));
                    }}
                    renderInput={(params) => <TextField {...params} label="Movie" helperText={error?.movieID} error={!!error?.movieID} />}
                />

                <Autocomplete
                    className="modal-input-x"
                    disablePortal
                    options={users || []}
                    getOptionLabel={(option) => option.name || option.name || option.email || ""}
                    fullWidth
                    classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                    value={users?.find(u => u.id === review.userID) || null}
                    onChange={(e, value) => {
                        setReview(prev => ({ ...prev, userID: value ? value.id : "" }));
                        setError(prev => ({ ...prev, userID: "" }));
                    }}
                    renderInput={(params) => <TextField {...params} label="User" helperText={error?.userID} error={!!error?.userID} />}
                />

                <div className="flex flex-col gap-2 mt-2 px-1">
                    <p className="text-gray-400 text-sm inline">Rating</p>
                    <Rating
                        name="rate"
                        value={Number(review.rate)}
                        precision={0.5}
                        onChange={(event, newValue) => {
                            setReview(prev => ({ ...prev, rate: newValue }));
                            setError(prev => ({ ...prev, rate: "" }));
                        }}
                        sx={{
                            '& .MuiRating-iconFilled': { color: '#fbbf24' },
                            '& .MuiRating-iconHover': { color: '#f59e0b' },
                            '& .MuiRating-iconEmpty': { color: '#4b5563' }
                        }}
                    />
                    {error?.rate && <p className="text-red-500 text-xs inline">{error.rate}</p>}
                </div>

                <TextField
                    className="modal-input-x mt-2"
                    name="content"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    rows={4}
                    label="Review Content"
                    variant="outlined"
                    value={review.content}
                    helperText={error?.content}
                    error={!!error?.content}
                />
            </DialogContent>

            <DialogActions className="modal-actions-x p-6 w-full flex flex-col">
                {loading ? (
                    <div className="w-full bg-slate-900/40 p-4 rounded-xl border border-white/10 shadow-inner">
                        <div className="flex justify-between text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                            <p className="animate-pulse inline">Syncing to Database...</p>
                            <p className="inline">{progress}%</p>
                        </div>
                        <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                            <div 
                                className="bg-linear-to-r from-cyan-400 via-fuchsia-500 to-yellow-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex justify-end gap-3 pt-2">
                        <Button onClick={handleClose} className="btn-cancel-x">Cancel</Button>
                        <Button disabled={loading} onClick={addReview} className="btn-submit-x">
                            {review.id ? "Save Changes" : "Add Review"}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}
