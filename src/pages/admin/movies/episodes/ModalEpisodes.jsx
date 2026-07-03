import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, Autocomplete } from '@mui/material';
import { useContext } from 'react';
import { MovieContext } from '../../../../contexts/MovieProvider';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalEpisodes({ open, onChangeInput, handleClose, addEpisode, error, loading, progress, episode, setEpisode }) {
    const movies = useContext(MovieContext);

    const handleNumberChange = (e) => {
        const onlyNums = e.target.value.replace(/[^0-9]/g, '');
        onChangeInput({ target: { name: e.target.name, value: onlyNums } });
    };

    return (
        <Dialog
            open={open}
            slots={{ transition: Transition }}
            keepMounted
            onClose={handleClose}
            className="modal-wrapper"
            PaperProps={{ className: "modal-inner" }}
            BackdropProps={{ className: "modal-backdrop-x" }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle className="modal-header-x">
                {episode.id ? "UPDATE EPISODE" : "ADD NEW EPISODE"}
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <Autocomplete
                    options={movies || []}
                    getOptionLabel={(opt) => opt?.name || ""}
                    value={movies?.find(m => m.id === episode.movieID) || null}
                    onChange={(e, val) => onChangeInput({ target: { name: "movieID", value: val?.id || "" } })}
                    classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Movie"
                            error={!!error.movieID}
                            helperText={error.movieID}
                            className="modal-input-x"
                        />
                    )}
                />
                <TextField
                    className="modal-input-x"
                    name="numberEpisode"
                    onChange={handleNumberChange}
                    fullWidth
                    label="Episode Number"
                    variant="outlined"
                    value={episode.numberEpisode}
                    helperText={error.numberEpisode}
                    error={!!error.numberEpisode}
                />

                <TextField
                    className="modal-input-x"
                    name="url"
                    onChange={onChangeInput}
                    fullWidth
                    label="Url"
                    variant="outlined"
                    value={episode.url}
                    helperText={error.url}
                    error={!!error.url}
                />
            </DialogContent>

            <DialogActions className="modal-actions-x p-6 w-full flex flex-col">
                {loading ? (
                    <div className="w-full bg-slate-900/40 p-4 rounded-xl border border-white/10 shadow-inner">
                        <div className="flex justify-between text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                            <span className="animate-pulse">Syncing to Cloud Database...</span>
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
                        <Button disabled={loading} onClick={addEpisode} className="btn-submit-x">
                            {episode.id ? "Save Changes" : "Add Episode"}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}
