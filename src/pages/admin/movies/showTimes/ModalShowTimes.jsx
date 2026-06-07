import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, MenuItem } from '@mui/material';
import { FaSpinner } from 'react-icons/fa';
import { useContext } from 'react';
import { MovieContext } from '../../../../contexts/MovieProvider';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const menuProps = {
    PaperProps: { sx: { bgcolor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' } }
};

export default function ModalShowTimes({ open, onChangeInput, handleClose, addShowTime, error, loading, showTime }) {
    const movies = useContext(MovieContext);

    const formatDateTimeValue = (value) => {
        if (!value) return "";

        let date;

        if (value?.toDate) {
            date = value.toDate();
        } else if (value?.seconds) {
            date = new Date(value.seconds * 1000);
        } else {
            date = new Date(value);
        }

        if (isNaN(date.getTime())) return String(value).slice(0, 16);

        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
                {showTime.id ? "UPDATE SHOWTIME" : "ADD NEW SHOWTIME"}
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <TextField
                    select
                    className="modal-input-x"
                    name="movieId"
                    onChange={onChangeInput}
                    fullWidth
                    label="Movie"
                    variant="outlined"
                    value={showTime.movieId || ""}
                    helperText={error.movieId}
                    error={!!error.movieId}
                    SelectProps={{ MenuProps: menuProps }}
                >
                    {movies?.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                            {item.name}
                        </MenuItem>
                    ))}
                </TextField>

                <div className="grid grid-cols-2 gap-4">
                    <TextField
                        className="modal-input-x"
                        name="time"
                        type="datetime-local"
                        onChange={onChangeInput}
                        fullWidth
                        label="Time"
                        variant="outlined"
                        value={formatDateTimeValue(showTime.time)}
                        helperText={error.time}
                        error={!!error.time}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        className="modal-input-x"
                        name="roomName"
                        onChange={onChangeInput}
                        fullWidth
                        label="Room Name"
                        variant="outlined"
                        value={showTime.roomName}
                        helperText={error.roomName}
                        error={!!error.roomName}
                    />
                </div>
            </DialogContent>

            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addShowTime} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin text-xl" /> : showTime.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}