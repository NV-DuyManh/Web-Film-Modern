import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, MenuItem } from '@mui/material';
import { FaSpinner } from 'react-icons/fa';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const menuProps = {
    PaperProps: { sx: { bgcolor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' } }
};

export default function ModalPlans({ open, onChangeInput, handleClose, addPlan, error, loading, plan }) {
    
    const handleNumberChange = (e, isFloat = false) => {
        // Chỉ cho phép nhập số (và dấu chấm nếu là float)
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
                {plan.id ? "UPDATE PLAN" : "ADD NEW PLAN"}
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <TextField
                    className="modal-input-x"
                    name="name"
                    onChange={onChangeInput}
                    fullWidth
                    label="Plan Name"
                    variant="outlined"
                    value={plan.name}
                    helperText={error.name}
                    error={!!error.name}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <TextField
                        className="modal-input-x"
                        name="level"
                        onChange={(e) => handleNumberChange(e, false)}
                        fullWidth
                        label="Level"
                        variant="outlined"
                        value={plan.level}
                        helperText={error.level}
                        error={!!error.level}
                    />
                    
                    <TextField
                        className="modal-input-x"
                        name="price"
                        onChange={(e) => handleNumberChange(e, true)}
                        fullWidth
                        label="Price"
                        variant="outlined"
                        value={plan.price}
                        helperText={error.price}
                        error={!!error.price}
                    />
                </div>
                
                <TextField
                    select
                    className="modal-input-x"
                    name="billingCycle"
                    onChange={onChangeInput}
                    fullWidth
                    label="Billing Cycle"
                    variant="outlined"
                    value={plan.billingCycle || ""}
                    helperText={error.billingCycle}
                    error={!!error.billingCycle}
                    SelectProps={{ MenuProps: menuProps }}
                >
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Yearly">Yearly</MenuItem>
                    <MenuItem value="Lifetime">Lifetime</MenuItem>
                </TextField>
            </DialogContent>
            
            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addPlan} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin text-xl" /> : plan.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}