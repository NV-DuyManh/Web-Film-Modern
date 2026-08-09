import { FaTimes } from 'react-icons/fa';
import { useMovies } from '../../../../hooks/useCollections';
import React, { useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, Autocomplete } from '@mui/material';
import { UserContext } from '../../../../contexts/UserProvider';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function ModalComments({ open, onChangeInput, handleClose, addComment, error, loading, progress, comment, setComment, setError }) {
    const movies = useMovies();
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
                    {comment.id  ? "Update Comment" : "Add New Comment"}
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
                    value={movies?.find(m => m.id === comment.movieID) || null}
                    onChange={(e, value) => {
                        setComment(prev => ({ ...prev, movieID: value ? value.id : "" }));
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
                    value={users?.find(u => u.id === comment.userID) || null}
                    onChange={(e, value) => {
                        setComment(prev => ({ ...prev, userID: value ? value.id : "" }));
                        setError(prev => ({ ...prev, userID: "" }));
                    }}
                    renderInput={(params) => <TextField {...params} label="User" helperText={error?.userID} error={!!error?.userID} />}
                />

                <TextField
                    className="modal-input-x mt-2"
                    name="description"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    rows={4}
                    label="Comment Description"
                    variant="outlined"
                    value={comment.description}
                    helperText={error?.description}
                    error={!!error?.description}
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
                        <Button disabled={loading} onClick={addComment} className="btn-submit-x">
                            {comment.id ? "Save Changes" : "Add Comment"}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default ModalComments;
