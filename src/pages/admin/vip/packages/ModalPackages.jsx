import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, Autocomplete } from '@mui/material';
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

export default function ModalPackages({ open, onChangeInput, handleClose, addPackage, error, loading, progress, packageItem }) {
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

            <DialogActions className="modal-actions-x p-6 w-full flex flex-col">
                {loading ? (
                    <div className="w-full bg-slate-900/40 p-4 rounded-xl border border-white/10 shadow-inner">
                        <div className="flex justify-between text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                            <span className="animate-pulse">Syncing to Cloud Database...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                            <div 
                                className="bg-linear-to-r from-cyan-400 via-fuchsia-500 to-yellow-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex justify-end gap-3 pt-2">
                        <Button onClick={handleClose} className="btn-cancel-x">Cancel</Button>
                        <Button disabled={loading} onClick={addPackage} className="btn-submit-x">
                            {packageItem.id ? "Save Changes" : "Add Package"}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}