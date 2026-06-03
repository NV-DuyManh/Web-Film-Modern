import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, MenuItem } from '@mui/material';
import { FaSpinner } from 'react-icons/fa';
import { useContext } from 'react';
import { PlanContext } from '../../../../contexts/PlanProvider';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const menuProps = {
    PaperProps: { sx: { bgcolor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' } }
};

export default function ModalFeatures({ open, onChangeInput, handleClose, addFeature, error, loading, feature }) {
    const plans = useContext(PlanContext);

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
                {feature.id ? "UPDATE FEATURE" : "ADD NEW FEATURE"}
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <TextField
                    select
                    className="modal-input-x"
                    name="planID"
                    onChange={onChangeInput}
                    fullWidth
                    label="Plan"
                    variant="outlined"
                    value={feature.planID || ""}
                    helperText={error.planID}
                    error={!!error.planID}
                    SelectProps={{ MenuProps: menuProps }}
                >
                    {plans?.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                            {item.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    className="modal-input-x"
                    name="description"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    variant="outlined"
                    value={feature.description}
                    helperText={error.description}
                    error={!!error.description}
                />

                <TextField
                    select
                    className="modal-input-x"
                    name="available"
                    onChange={onChangeInput}
                    fullWidth
                    label="Available"
                    variant="outlined"
                    value={feature.available}
                    helperText={error.available}
                    error={!!error.available}
                    SelectProps={{ MenuProps: menuProps }}
                >
                    <MenuItem value={true}>True</MenuItem>
                    <MenuItem value={false}>False</MenuItem>
                </TextField>
            </DialogContent>

            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addFeature} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin text-xl" /> : feature.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}