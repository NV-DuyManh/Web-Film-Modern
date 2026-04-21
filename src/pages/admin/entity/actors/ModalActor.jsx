
import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FaSpinner } from 'react-icons/fa';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalActor({ open, onChangeInput, handleClose, addactor, error, loading, actor }) {
    return (
        <Dialog
            open={open}
            slots={{ transition: Transition }}
            keepMounted
            onClose={handleClose}
            className="modal-wrapper"
            PaperProps={{ className: "modal-inner" }}
            BackdropProps={{ className: "modal-backdrop-x" }}
        >
            <DialogTitle className="modal-header-x">
                {actor.id ? "UPDATE ACTOR" : "ADD ACTOR"}
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <TextField
                    className="modal-input-x"
                    name="imgUrl"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    label="Image"
                    variant="outlined"
                    value={actor.imgUrl}
                    helperText={error.imgUrl}
                    error={!!error.imgUrl}
                />
                <TextField
                    className="modal-input-x"
                    name="name"
                    onChange={onChangeInput}
                    fullWidth
                    label="Name"
                    variant="outlined"
                    value={actor.name}
                    helperText={error.name}
                    error={!!error.name}
                />
                <TextField
                    className="modal-input-x"
                    name="description"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    variant="outlined"
                    value={actor.description}
                    helperText={error.description}
                    error={!!error.description}
                />
                <TextField
                    className="modal-input-x"
                    name="sexID"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    label="Sex"
                    variant="outlined"
                    value={actor.sexID}
                    helperText={error.sexID}
                    error={!!error.sexID}
                />
                <TextField
                    className="modal-input-x"
                    name="countriesID"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    label="Country"
                    variant="outlined"
                    value={actor.countriesID}
                    helperText={error.countriesID}
                    error={!!error.countriesID}
                />
            </DialogContent>

            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addactor} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin" /> : actor.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}