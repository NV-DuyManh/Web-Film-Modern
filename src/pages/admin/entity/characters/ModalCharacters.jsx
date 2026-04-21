import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FaSpinner } from 'react-icons/fa';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalCharacters({ open, onChangeInput, handleClose, addcharacter, error, loading, character }) {
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
                {character.id ? "UPDATE CHARACTER" : "ADD CHARACTER"}
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <TextField
                    className="modal-input-x"
                    name="imgUrl"
                    onChange={onChangeInput}
                    fullWidth
                    label="Image URL"
                    variant="outlined"
                    value={character.imgUrl}
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
                    value={character.name}
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
                    value={character.description}
                    helperText={error.description}
                    error={!!error.description}
                />
                <TextField
                    className="modal-input-x"
                    name="roleType"
                    onChange={onChangeInput}
                    fullWidth
                    label="Role"
                    variant="outlined"
                    value={character.roleType}
                    helperText={error.roleType}
                    error={!!error.roleType}
                />

            </DialogContent>

            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addcharacter} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin" /> : character.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}