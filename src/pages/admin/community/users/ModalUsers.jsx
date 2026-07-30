import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Radio, RadioGroup, styled, TextField } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FaTimes,  FaCloudUploadAlt, FaLink, FaSpinner } from 'react-icons/fa';
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

export default function ModalUsers({ open, onChangeInput, handleClose, addUser, error, loading, progress, user, handleImageChange, setUser }) {
    const [uploadMode, setUploadMode] = React.useState('file');

    const handleUrlChange = (e) => {
        const url = e.target.value;
        if (setUser) setUser(pre => ({ ...pre, avatarUrl: url, imgFile: null }));
        else onChangeInput({ target: { name: 'avatarUrl', value: url } });
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
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className="modal-header-x flex justify-between items-center">
                <p className="glow-text-gold text-xl md:text-2xl font-black tracking-tight inline" style={{ paddingBottom: '0.1em' }}>
                    {user.id  ? "Update User" : "Add New User"}
                </p>
                <button 
                    onClick={handleClose}
                    className="w-8 h-8 shrink-0 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] hover:scale-110 transition-all duration-300 group cursor-pointer"
                >
                    <FaTimes size={16} className="transition-transform duration-200 group-hover:rotate-180 group-hover:scale-125" style={{ strokeWidth: '1.5', stroke: 'currentColor' }} />
                </button>
            </DialogTitle>

            <DialogContent className="modal-body-x grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
                
                <div className="lg:col-span-2">
                    <TextField
                        className="modal-input-x"
                        name="name"
                        onChange={onChangeInput}
                        fullWidth
                        label="Full Name"
                        variant="outlined"
                        value={user.name || ''}
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

                    <TextField
                        className="modal-input-x"
                        name="address"
                        onChange={onChangeInput}
                        fullWidth
                        label="Address"
                        variant="outlined"
                        value={user.address || ''}
                    />
                    
                    <TextField
                        className="modal-input-x"
                        name="dateOfBirth"
                        type="date"
                        onChange={onChangeInput}
                        fullWidth
                        label="Date of Birth"
                        variant="outlined"
                        value={user.dateOfBirth || ''}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ style: { colorScheme: 'dark' } }}
                    />
                    
                    <FormControl className="gender-box-wrapper" error={!!error.sexId}>
                        <div className={`gender-box ${!!error.sexId ? 'error' : ''}`}>
                            <p className="gender-label inline">Gender</p>
                            <RadioGroup
                                name="sexId"
                                sx={{ flexDirection: "row", width: '100%', justifyContent: 'space-around' }}
                                value={user.sexId}
                                onChange={onChangeInput}
                            >
                                <FormControlLabel value="Male" control={<Radio sx={{ color: !!error.sexId ? '#ef4444' : '#4ade80', '&.Mui-checked': { color: '#4ade80' } }} />} label="Male" sx={{ color: '#e5e7eb', margin: 0 }} />
                                <FormControlLabel value="Female" control={<Radio sx={{ color: !!error.sexId ? '#ef4444' : '#4ade80', '&.Mui-checked': { color: '#4ade80' } }} />} label="Female" sx={{ color: '#e5e7eb', margin: 0 }} />
                                <FormControlLabel value="Other" control={<Radio sx={{ color: !!error.sexId ? '#ef4444' : '#4ade80', '&.Mui-checked': { color: '#4ade80' } }} />} label="Other" sx={{ color: '#e5e7eb', margin: 0 }} />
                            </RadioGroup>
                        </div>
                        {error.sexId && <p className="gender-error-text inline">{error.sexId}</p>}
                    </FormControl>

                    <FormControl className="gender-box-wrapper" error={!!error.role}>
                        <div className={`gender-box ${!!error.role ? 'error' : ''}`}>
                            <p className="gender-label inline">Role</p>
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
                        {error.role && <p className="gender-error-text inline">{error.role}</p>}
                    </FormControl>
                </div>

                <div className="lg:col-span-1 flex flex-col items-center justify-start mt-2 border-l border-white/10 pl-6">
                    <div className="upload-container pb-2 w-full flex flex-col items-center justify-start border-none bg-transparent">
                        <p className="upload-title text-cyan-400 mb-3 inline">User Avatar</p>
                        
                        <div className="flex bg-slate-900/80 rounded-lg p-0.5 mb-4 w-full max-w-50 border border-white/10 mx-auto">
                            <button type="button" onClick={() => setUploadMode('file')} className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all duration-300 ${uploadMode === 'file' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                                <FaCloudUploadAlt className="text-xs" /> File
                            </button>
                            <button type="button" onClick={() => setUploadMode('url')} className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all duration-300 ${uploadMode === 'url' ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-[0_0_12px_rgba(217,70,239,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                                <FaLink className="text-xs" /> URL
                            </button>
                        </div>

                        <div className="flex flex-col items-center w-full min-h-40 justify-start">
                            {uploadMode === 'file' ? (
                                <div className="relative w-44 h-44 rounded-full border-2 border-dashed border-slate-600 hover:border-cyan-400 overflow-hidden group transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.6)] bg-slate-900/50 flex items-center justify-center">
                                    <img 
                                        src={user.imgFile ? URL.createObjectURL(user.imgFile) : (user.avatarUrl || LOGO)} 
                                        alt="User Avatar" 
                                        className="w-full h-full object-cover transition-all duration-500 group-hover:opacity-30" 
                                    />
                                    <Button component="label" className="absolute! inset-0! w-full! h-full! min-w-0! !p-0! rounded-full! cursor-pointer">
                                        <VisuallyHiddenInput type="file" onChange={handleImageChange} accept="image/*" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <FaCloudUploadAlt className="text-4xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] mb-2" />
                                            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest inline">Upload</p>
                                        </div>
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-full flex flex-col gap-4 items-center">
                                    <TextField
                                        className="modal-input-x w-full"
                                        placeholder="https://example.com/avatar.jpg"
                                        value={user.avatarUrl?.startsWith('http') ? user.avatarUrl : ''}
                                        onChange={handleUrlChange}
                                        fullWidth
                                        size="small"
                                        InputProps={{ style: { fontSize: 12 } }}
                                    />
                                    <div className="w-44 h-44 rounded-full overflow-hidden border border-white/10 bg-slate-900/50 flex items-center justify-center">
                                        <img src={user.avatarUrl || LOGO} className="w-full h-full object-cover" alt="Preview" onError={(e) => e.target.src = LOGO} />
                                    </div>
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
                            <p className="animate-pulse inline">Syncing Data...</p>
                            <p className="inline">{progress || 0}%</p>
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
