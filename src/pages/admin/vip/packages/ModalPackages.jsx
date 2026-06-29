import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, Autocomplete } from '@mui/material';
import { FaSpinner } from 'react-icons/fa';
import { useContext } from 'react';
import { PlanContext } from '../../../../contexts/PlanProvider';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const TIME_OPTIONS = [
    { id: 1, label: "1 Month" },
    { id: 3, label: "3 Months" },
    { id: 6, label: "6 Months" },
    { id: 12, label: "12 Months" }
];

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
                <Autocomplete
                    options={plans || []}
                    getOptionLabel={(opt) => opt?.name || ""}
                    value={plans?.find(p => p.id === packageItem.planID) || null}
                    onChange={(e, val) => onChangeInput({ target: { name: "planID", value: val?.id || "" } })}
                    classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                    renderInput={(params) => (
                        <TextField 
                            {...params} 
                            label="Plan" 
                            error={!!error.planID} 
                            helperText={error.planID} 
                            className="modal-input-x" 
                        />
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <TextField
                        className="modal-input-x"
                        name="discount"
                        onChange={(e) => handleNumberChange(e, true)}
                        fullWidth
                        label="Discount (%)"
                        variant="outlined"
                        value={packageItem.discount}
                        helperText={error.discount}
                        error={!!error.discount}
                    />

                    <Autocomplete
                        options={TIME_OPTIONS}
                        getOptionLabel={(opt) => opt.label}
                        value={TIME_OPTIONS.find(t => t.id === packageItem.time) || null}
                        onChange={(e, val) => onChangeInput({ target: { name: "time", value: val ? val.id : "" } })}
                        classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Duration" 
                                error={!!error.time} 
                                helperText={error.time} 
                                className="modal-input-x" 
                            />
                        )}
                    />
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