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

export default function ModalPackages({ open, onChangeInput, handleClose, addPackage, error, loading, packageItem }) {
    const plans = useContext(PlanContext);

    const handleNumberChange = (e, isFloat = false) => {
        const regex = isFloat ? /[^0-9.]/g : /[^0-9]/g;
        const onlyNums = e.target.value.replace(regex, '');
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
                {packageItem.id ? "UPDATE PACKAGE" : "ADD NEW PACKAGE"}
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
                    value={packageItem.planID || ""}
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

                <div className="grid grid-cols-2 gap-4">
                    <TextField
                        className="modal-input-x"
                        name="discount"
                        onChange={(e) => handleNumberChange(e, true)}
                        fullWidth
                        label="Discount"
                        variant="outlined"
                        value={packageItem.discount}
                        helperText={error.discount}
                        error={!!error.discount}
                    />

                    <TextField
                        select
                        className="modal-input-x"
                        name="time"
                        onChange={onChangeInput}
                        fullWidth
                        label="Duration"
                        variant="outlined"
                        value={packageItem.time}
                        helperText={error.time}
                        error={!!error.time}
                        SelectProps={{ MenuProps: menuProps }}
                    >
                        <MenuItem value={1}>1 Month</MenuItem>
                        <MenuItem value={3}>3 Months</MenuItem>
                        <MenuItem value={6}>6 Months</MenuItem>
                        <MenuItem value={12}>12 Months</MenuItem>
                    </TextField>
                </div>
            </DialogContent>

            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addPackage} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin text-xl" /> : packageItem.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}