import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Radio, RadioGroup, styled, TextField } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import LOGO from "../../../../assets/Logo.png";

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

export default function ModalUsers({ open, onChangeInput, handleClose, addUser, error, loading, progress, user, handleImageChange }) {
    const [uploadMode, setUploadMode] = React.useState('LOCAL');
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
                        name="displayName"
                        onChange={onChangeInput}
                        fullWidth
                        label="Name"
                        variant="outlined"
                        value={user.displayName || user.name || ''}
                        helperText={error.displayName}
                        error={!!error.displayName}
                    />
                    
                    <TextField
                        className="modal-input-x"
                        name="email"
                        type="email"
                        onChange={onChangeInput}
                        fullWidth
                        label="Email"
                        variant="outlined"
                        value={user.email || ''}
                        helperText={error.email}
                        error={!!error.email}
                    />
                    
                    <TextField
                        className="modal-input-x"
                        name="password"
                        type="text"
                        onChange={onChangeInput}
                        fullWidth
                        label="Password"
                        variant="outlined"
                        value={user.password || ''}
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
                        value={user.phone || ''}
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

                    <FormControl className="gender-box-wrapper" error={!!error.role}>
                        <div className={`gender-box ${!!error.role ? 'error' : ''}`}>
                            <span className="gender-label">Role</span>
                            <RadioGroup
                                name="role"
                                sx={{ flexDirection: "row", width: '100%', justifyContent: 'space-around' }}
                                value={user.role || 'user'}
                                onChange={onChangeInput}
                            >
                                <FormControlLabel value="user" control={<Radio sx={{ color: !!error.role ? '#ef4444' : '#fbbf24', '&.Mui-checked': { color: '#fbbf24' } }} />} label="Client" sx={{ color: '#e5e7eb', margin: 0 }} />
                                <FormControlLabel value="admin" control={<Radio sx={{ color: !!error.role ? '#ef4444' : '#fbbf24', '&.Mui-checked': { color: '#fbbf24' } }} />} label="Admin" sx={{ color: '#e5e7eb', margin: 0 }} />
                            </RadioGroup>
                        </div>
                        {error.role && <span className="gender-error-text">{error.role}</span>}
                    </FormControl>
                </div>

                <div className="lg:col-span-1 flex flex-col items-center justify-start mt-2 border-l border-white/10 pl-6">
                    <div className="upload-container pb-2 w-full flex flex-col items-center justify-start border-none bg-transparent">
                        <span className="upload-title text-cyan-400">User Avatar</span>
                        
                        <div className="flex border-b border-white/10 w-full max-w-70 mx-auto mt-2 mb-6 relative">
                            <button 
                                type="button"
                                onClick={() => setUploadMode('LOCAL')} 
                                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border-b-2 ${uploadMode === 'LOCAL' 
                                    ? 'border-cyan-400 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/20'}`} 
                            > 
                                💻 UPLOAD 
                            </button>
                            <button 
                                type="button"
                                onClick={() => setUploadMode('LINK')} 
                                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border-b-2 ${uploadMode === 'LINK' 
                                    ? 'border-fuchsia-400 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/20'}`} 
                            > 
                                🔗 URL 
                            </button>
                        </div>

                        <div className="flex flex-col items-center w-full min-h-40 justify-start">
                            {uploadMode === 'LOCAL' && (
                                <div className="relative w-44 h-44 rounded-full border-2 border-transparent hover:border-cyan-400 overflow-hidden group transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.6)] bg-slate-900">
                                    <img 
                                        src={(user.imgUrl || user.avatarUrl)?.startsWith('http') ? LOGO : (user.imgUrl || user.avatarUrl || LOGO)} 
                                        alt="User Avatar" 
                                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:opacity-30" 
                                    />
                                    <Button component="label" className="absolute! inset-0! w-full! h-full! min-w-0! !p-0! rounded-full! cursor-pointer">
                                        <VisuallyHiddenInput type="file" onChange={handleImageChange} accept="image/*" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <FaCloudUploadAlt className="text-4xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] mb-2" />
                                            <span className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Upload Local</span>
                                        </div>
                                    </Button>
                                </div>
                            )}

                            {uploadMode === 'LINK' && (
                                <div className="w-full pt-4">
                                    <TextField
                                        className="modal-input-x w-full"
                                        name="imgUrl"
                                        onChange={onChangeInput}
                                        label="Paste Image URL here"
                                        variant="outlined"
                                        value={(user.imgUrl || user.avatarUrl)?.startsWith('http') ? (user.imgUrl || user.avatarUrl) : ''}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                transition: "all 0.3s ease",
                                                "&.Mui-focused fieldset": {
                                                    borderColor: "#d946ef !important",
                                                    boxShadow: "0 0 15px rgba(217,70,239,0.5)"
                                                }
                                            },
                                            "& label.Mui-focused": {
                                                color: "#d946ef !important"
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </DialogContent>
            
            <DialogActions className="modal-actions-x p-6 w-full flex flex-col">
                {loading ? (
                    <div className="w-full bg-slate-900/40 p-4 rounded-xl border border-white/10 shadow-inner">
                        <div className="flex justify-between text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                            <span className="animate-pulse">Syncing Data...</span>
                            <span>{progress || 0}%</span>
                        </div>
                        <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                            <div 
                                className="bg-linear-to-r from-cyan-400 via-fuchsia-500 to-yellow-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                                style={{ width: `${progress || 0}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex justify-end gap-3 pt-2">
                        <Button onClick={handleClose} className="btn-cancel-x">
                            Cancel
                        </Button>
                        <Button disabled={loading} onClick={addUser} className="btn-submit-x">
                            {user.id ? "UPDATE" : "ADD"}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}