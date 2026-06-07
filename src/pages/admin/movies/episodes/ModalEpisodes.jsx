import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide } from '@mui/material';
import { FaSpinner } from 'react-icons/fa';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalEpisodes({ open, onChangeInput, handleClose, addEpisode, error, loading, episode }) {

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
                <div className="grid grid-cols-2 gap-4">
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
                        name="duration"
                        onChange={handleNumberChange}
                        fullWidth
                        label="Duration"
                        variant="outlined"
                        value={episode.duration}
                        helperText={error.duration}
                        error={!!error.duration}
                    />
                </div>

                <TextField
                    className="modal-input-x"
                    name="title"
                    onChange={onChangeInput}
                    fullWidth
                    label="Title"
                    variant="outlined"
                    value={episode.title}
                    helperText={error.title}
                    error={!!error.title}
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