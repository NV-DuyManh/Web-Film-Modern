import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, Autocomplete } from '@mui/material';
import { FaSpinner } from 'react-icons/fa';
import { useContext } from 'react';
import { MovieContext } from '../../../../contexts/MovieProvider';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalEpisodes({ open, onChangeInput, handleClose, addEpisode, error, loading, episode, setEpisode }) {
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

            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addEpisode} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin text-xl" /> : episode.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}