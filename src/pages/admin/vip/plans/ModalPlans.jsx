import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, MenuItem } from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const menuProps = {
    PaperProps: { sx: { bgcolor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' } }
};

export default function ModalPlans({ open, onChangeInput, handleClose, addPlan, error, loading, progress, plan }) {
    
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
                        <Button disabled={loading} onClick={addPlan} className="btn-submit-x">
                            {plan.id ? "Save Changes" : "Add Plan"}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}