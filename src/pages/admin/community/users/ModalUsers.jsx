import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Radio, RadioGroup, styled, TextField } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function ModalUsers({ open, onChangeInput, handleClose, addUser, error, loading, user, handleImageChange }) {
    return (
        <Dialog
            open={open}
            slots={{ transition: Transition }}
            keepMounted
            onClose={handleClose}
            className="modal-wrapper"
            PaperProps={{ className: "modal-inner" }}
            BackdropProps={{ className: "modal-backdrop-x" }}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className="modal-header-x">
                {user.id ? "UPDATE USER" : "ADD NEW USER"}
            </DialogTitle>

            <DialogContent className="modal-body-x grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
                
                <div className="lg:col-span-2 space-y-4">
                    <TextField
                        className="modal-input-x"
                        name="name"
                        onChange={onChangeInput}
                        fullWidth
                        label="Name"
                        variant="outlined"
                        value={user.name}
                        helperText={error.name}
                        error={!!error.name}
                    />
                    
                    <TextField
                        className="modal-input-x"
                        name="email"
                        type="email"
                        onChange={onChangeInput}
                        fullWidth
                        label="Email"
                        variant="outlined"
                        value={user.email}
                        helperText={error.email}
                        error={!!error.email}
                    />
                    
                    <TextField
                        className="modal-input-x"
                        name="password"
                        type="password"
                        onChange={onChangeInput}
                        fullWidth
                        label="Password"
                        variant="outlined"
                        value={user.password}
                        helperText={error.password}
                        error={!!error.password}
                    />
                    
                    <TextField
                        className="modal-input-x"
                        name="phone"
                        onChange={onChangeInput}
                        fullWidth
                        label="Phone Number"
                        variant="outlined"
                        value={user.phone}
                        helperText={error.phone}
                        error={!!error.phone}
                    />
                    
                    <FormControl className="gender-box-wrapper" error={!!error.sexId}>
                        <div className={`gender-box ${!!error.sexId ? 'error' : ''}`}>
                            <span className="gender-label">Gender</span>
                            <RadioGroup
                                name="sexId"
                                sx={{ flexDirection: "row", width: '100%', justifyContent: 'space-around' }}
                                value={user.sexId}
                                onChange={onChangeInput}
                            >
                                <FormControlLabel value="Female" control={<Radio sx={{ color: !!error.sexId ? '#ef4444' : '#4ade80', '&.Mui-checked': { color: '#4ade80' } }} />} label="Female" sx={{ color: '#e5e7eb', margin: 0 }} />
                                <FormControlLabel value="Male" control={<Radio sx={{ color: !!error.sexId ? '#ef4444' : '#4ade80', '&.Mui-checked': { color: '#4ade80' } }} />} label="Male" sx={{ color: '#e5e7eb', margin: 0 }} />
                                <FormControlLabel value="Other" control={<Radio sx={{ color: !!error.sexId ? '#ef4444' : '#4ade80', '&.Mui-checked': { color: '#4ade80' } }} />} label="Other" sx={{ color: '#e5e7eb', margin: 0 }} />
                            </RadioGroup>
                        </div>
                        {error.sexId && <span className="gender-error-text">{error.sexId}</span>}
                    </FormControl>
                </div>

                <div className="lg:col-span-1 flex flex-col items-center justify-start mt-2 border-l border-white/10 pl-6">
                    <div className="upload-container w-full min-h-62.5 flex flex-col justify-center items-center border-none bg-transparent">
                        <span className="upload-title text-cyan-400 mb-6">User Avatar</span>
                        
                        <div className="relative w-44 h-44 rounded-full border-2 border-transparent hover:border-cyan-400 overflow-hidden group transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.6)] bg-slate-900">
                            <img 
                                src={user.avatarUrl} 
                                alt="User Avatar" 
                                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:opacity-30" 
                            />
                            <Button component="label" className="absolute! inset-0! w-full! h-full! min-w-0! !p-0! rounded-full! cursor-pointer">
                                <VisuallyHiddenInput type="file" onChange={handleImageChange} accept="image/*" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <FaCloudUploadAlt className="text-4xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] mb-2" />
                                    <span className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Upload</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>

            </DialogContent>
            
            <DialogActions className="modal-actions-x">
                <Button onClick={handleClose} className="btn-cancel-x">
                    Cancel
                </Button>
                <Button disabled={loading} onClick={addUser} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin text-xl" /> : user.id ? "UPDATE" : "ADD"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}