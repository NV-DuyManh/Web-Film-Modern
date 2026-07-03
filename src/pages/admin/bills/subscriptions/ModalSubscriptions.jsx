import React, { useContext } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide, Autocomplete, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { PlanContext } from "../../../../contexts/PlanProvider";
import { UserContext } from "../../../../contexts/UserProvider";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalSubscriptions({ open, onChangeInput, handleClose, addSubscription, error, loading, progress, subscription, setSubscription, setError }) {
    const plans = useContext(PlanContext);
    const users = useContext(UserContext);

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleClose}
            className="modal-wrapper"
            PaperProps={{ className: "modal-inner" }}
            BackdropProps={{ className: "modal-backdrop-x" }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle className="modal-header-x">
                {subscription.id ? "UPDATE SUBSCRIPTION" : "ADD SUBSCRIPTION"}
            </DialogTitle>

            <DialogContent className="modal-body-x grid grid-cols-1 gap-4 pt-4">
                <TextField
                    className="modal-input-x"
                    name="transactionID"
                    onChange={onChangeInput}
                    fullWidth
                    label="Transaction ID"
                    variant="outlined"
                    value={subscription.transactionID}
                    helperText={error?.transactionID}
                    error={!!error?.transactionID}
                />

                <Autocomplete
                    className="modal-input-x"
                    disablePortal
                    options={users || []}
                    getOptionLabel={(option) => option.displayName || option.name || option.email || ""}
                    fullWidth
                    classes={{ paper: "neon-paper", listbox: "neon-listbox", option: "neon-option" }}
                    value={users?.find(u => u.id === subscription.userId) || null}
                    onChange={(e, value) => {
                        setSubscription(prev => ({ ...prev, userId: value ? value.id : "" }));
                        setError(prev => ({ ...prev, userId: "" }));
                    }}
                    renderInput={(params) => <TextField {...params} label="User" helperText={error?.userId} error={!!error?.userId} />}
                />

                <Autocomplete
                    className="modal-input-x"
                    disablePortal
                    options={plans || []}
                    getOptionLabel={(option) => option.name || ""}
                    fullWidth
                    classes={{ paper: "neon-paper", listbox: "neon-listbox", option: "neon-option" }}
                    value={plans?.find(p => p.id === subscription.planID) || null}
                    onChange={(e, value) => {
                        setSubscription(prev => ({ ...prev, planID: value ? value.id : "" }));
                        setError(prev => ({ ...prev, planID: "" }));
                    }}
                    renderInput={(params) => <TextField {...params} label="Plan" helperText={error?.planID} error={!!error?.planID} />}
                />

                <div className="grid grid-cols-2 gap-4">
                    <TextField
                        className="modal-input-x"
                        name="price"
                        type="number"
                        onChange={onChangeInput}
                        fullWidth
                        label="Price"
                        variant="outlined"
                        value={subscription.price}
                        helperText={error?.price}
                        error={!!error?.price}
                    />
                    <FormControl fullWidth className="modal-input-x" error={!!error?.paymentMethod}>
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                            name="paymentMethod"
                            value={subscription.paymentMethod}
                            label="Payment Method"
                            onChange={onChangeInput}
                            MenuProps={{ classes: { paper: "neon-paper" } }}
                        >
                            <MenuItem value="Credit Card" className="neon-option">Credit Card</MenuItem>
                            <MenuItem value="Paypal" className="neon-option">Paypal</MenuItem>
                            <MenuItem value="Momo" className="neon-option">Momo</MenuItem>
                            <MenuItem value="ZaloPay" className="neon-option">ZaloPay</MenuItem>
                        </Select>
                        {error?.paymentMethod && <span className="text-red-500 text-xs ml-4 mt-1">{error.paymentMethod}</span>}
                    </FormControl>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <TextField
                        className="modal-input-x"
                        name="startDate"
                        type="datetime-local"
                        onChange={onChangeInput}
                        fullWidth
                        label="Start Date"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        value={subscription.startDate}
                        helperText={error?.startDate}
                        error={!!error?.startDate}
                    />
                    <TextField
                        className="modal-input-x"
                        name="expiryDate"
                        type="datetime-local"
                        onChange={onChangeInput}
                        fullWidth
                        label="Expiry Date"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        value={subscription.expiryDate}
                        helperText={error?.expiryDate}
                        error={!!error?.expiryDate}
                    />
                </div>

                <FormControl fullWidth className="modal-input-x" error={!!error?.status}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        name="status"
                        value={subscription.status}
                        label="Status"
                        onChange={onChangeInput}
                        MenuProps={{ classes: { paper: "neon-paper" } }}
                    >
                        <MenuItem value="success" className="neon-option">Success</MenuItem>
                        <MenuItem value="pending" className="neon-option">Pending</MenuItem>
                        <MenuItem value="cancel" className="neon-option">Cancel</MenuItem>
                    </Select>
                        {error?.status && <span className="text-red-500 text-xs ml-4 mt-1">{error.status}</span>}
                </FormControl>
            </DialogContent>

            <DialogActions className="modal-actions-x p-6 w-full flex flex-col">
                {loading ? (
                    <div className="w-full bg-slate-900/40 p-4 rounded-xl border border-white/10 shadow-inner">
                        <div className="flex justify-between text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                            <span className="animate-pulse">Syncing to Database...</span>
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
                        <Button disabled={loading} onClick={addSubscription} className="btn-submit-x">
                            {subscription.id ? "Save Changes" : "Add Subscription"}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}
