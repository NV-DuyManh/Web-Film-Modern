import React, { useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, Autocomplete } from '@mui/material';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { UserContext } from '../../../../contexts/UserProvider';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalComments({ open, onChangeInput, handleClose, addComment, error, loading, progress, comment, setComment, setError }) {
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
                <span className="glow-text-multi text-2xl md:text-3xl font-black tracking-tight" style={{ paddingBottom: '0.1em' }}>
                    {comment.id  ? "Update Comment" : "Add New Comment"}
                </span>
                <button 
                    onClick={handleClose}
                    className="w-10 h-10 shrink-0 rounded-full bg-red-500/10 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-500 hover:text-white hover:border-red-500 hover:bg-red-500 hover:rotate-90 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] transition-all duration-300 cursor-pointer"
                >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"></path></svg>
                </button>
            </DialogTitle>

            <DialogContent className="modal-body-x grid grid-cols-1 gap-4 pt-4">
                <Autocomplete
                    className="modal-input-x"
                    disablePortal
                    options={movies || []}
                    getOptionLabel={(option) => option.name || ""}
                    fullWidth
                    classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                    value={movies?.find(m => m.id === comment.moviesId) || null}
                    onChange={(e, value) => {
                        setComment(prev => ({ ...prev, moviesId: value ? value.id : "" }));
                        setError(prev => ({ ...prev, moviesId: "" }));
                    }}
                    renderInput={(params) => <TextField {...params} label="Movie" helperText={error?.moviesId} error={!!error?.moviesId} />}
                />

                <Autocomplete
                    className="modal-input-x"
                    disablePortal
                    options={users || []}
                    getOptionLabel={(option) => option.displayName || option.name || option.email || ""}
                    fullWidth
                    classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                    value={users?.find(u => u.id === comment.userId) || null}
                    onChange={(e, value) => {
                        setComment(prev => ({ ...prev, userId: value ? value.id : "" }));
                        setError(prev => ({ ...prev, userId: "" }));
                    }}
                    renderInput={(params) => <TextField {...params} label="User" helperText={error?.userId} error={!!error?.userId} />}
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
                            <span className="animate-pulse">Syncing to Database...</span>
                            <span>{progress}%</span>
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
