import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FaSpinner } from 'react-icons/fa';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalAuthors({ open, onChangeInput, handleClose, addauthor, error, loading, author }) {
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
                {author.id ? "UPDATE AUTHOR" : "ADD AUTHOR"}
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <TextField
                    className="modal-input-x"
                    name="imgUrl"
                    onChange={onChangeInput}
                    fullWidth
                    label="Image"
                    variant="outlined"
                    value={author.imgUrl}
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
                    value={author.name}
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
                    value={author.description}
                    helperText={error.description}
                    error={!!error.description}
                />
                <TextField
                    className="modal-input-x"
                    name="sexID"
                    onChange={onChangeInput}
                    fullWidth
                    label="Sex"
                    variant="outlined"
                    value={author.sexID}
                    helperText={error.sexID}
                    error={!!error.sexID}
                />
                <TextField
                    className="modal-input-x"
                    name="countriesID"
                    onChange={onChangeInput}
                    fullWidth
                    label="Country"
                    variant="outlined"
                    value={author.countriesID}
                    helperText={error.countriesID}
                    error={!!error.countriesID}
                />
            </DialogContent>

            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addauthor} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin" /> : author.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}