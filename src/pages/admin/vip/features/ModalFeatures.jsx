import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, Autocomplete } from '@mui/material';
import { useContext } from 'react';
import { PlanContext } from '../../../../contexts/PlanProvider';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const AVAILABLE_OPTIONS = [
    { id: true, label: "True" },
    { id: false, label: "False" }
];

export default function ModalFeatures({ open, onChangeInput, handleClose, addFeature, error, loading, progress, feature }) {
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
                <Autocomplete
                    options={plans || []}
                    getOptionLabel={(opt) => opt?.name || ""}
                    value={plans?.find(p => p.id === feature.planID) || null}
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

                <Autocomplete
                    options={AVAILABLE_OPTIONS}
                    getOptionLabel={(opt) => opt.label}
                    value={feature.available !== "" ? AVAILABLE_OPTIONS.find(a => a.id === feature.available) : null}
                    onChange={(e, val) => onChangeInput({ target: { name: "available", value: val !== null ? val.id : "" } })}
                    classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                    renderInput={(params) => (
                        <TextField 
                            {...params} 
                            label="Available" 
                            error={!!error.available} 
                            helperText={error.available} 
                            className="modal-input-x" 
                        />
                    )}
                />
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
                        <Button disabled={loading} onClick={addFeature} className="btn-submit-x">
                            {feature.id ? "Save Changes" : "Add Feature"}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}
