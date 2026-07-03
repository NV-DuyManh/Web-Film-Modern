import * as React from 'react';
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Radio, RadioGroup, styled, TextField } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FaCloudUploadAlt, FaLink } from 'react-icons/fa';
import { COUNTRIES } from '../../../../utils/Contants';
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

export default function ModalCharacters({ open, onChangeInput, handleClose, addcharacter, error, loading, progress, character, handleImageChange, setCharacter }) {
    const [uploadMode, setUploadMode] = React.useState('file');

    const handleUrlChange = (e) => {
        const url = e.target.value;
        if (setCharacter) setCharacter(pre => ({ ...pre, imgUrl: url, imgFile: null }));
        else onChangeInput({ target: { name: 'imgUrl', value: url } });
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
        >
            <DialogTitle className="modal-header-x">
                {character.id ? "UPDATE CHARACTER" : "ADD CHARACTER"}
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <TextField
                    className="modal-input-x"
                    name="name"
                    onChange={onChangeInput}
                    fullWidth
                    label="Name"
                    variant="outlined"
                    value={character.name}
                    helperText={error?.name}
                    error={!!error?.name}
                />
                
                <TextField
                    className="modal-input-x"
                    name="description"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    variant="outlined"
                    value={character.description}
                    helperText={error?.description}
                    error={!!error?.description}
                />
                
                <Autocomplete
                    className="modal-input-x"
                    disablePortal
                    options={COUNTRIES}
                    fullWidth
                    classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                    PopperProps={{ placement: "top-end" }}
                    value={character.countriesID || null}
                    onChange={(e, value) => {
                        onChangeInput({ target: { name: "countriesID", value: value } });
                    }}
                    renderInput={(params) => <TextField {...params} 
                        label="Country"
                        helperText={error?.countriesID}
                        error={!!error?.countriesID} />}
                />
                
                <FormControl className="gender-box-wrapper" error={!!error?.sexID}>
                    <div className={`gender-box ${!!error?.sexID ? 'error' : ''}`}>
                        <span className="gender-label">Gender</span>
                        <RadioGroup
                            name="sexID"
                            sx={{ flexDirection: "row", width: '100%', justifyContent: 'space-around' }}
                            value={character.sexID}
                            onChange={onChangeInput}
                        >
                            <FormControlLabel value="Female" control={<Radio sx={{ color: !!error?.sexID ? '#ef4444' : '#4ade80', '&.Mui-checked': { color: '#4ade80' } }} />} label="Female" sx={{ color: '#e5e7eb', margin: 0 }} />
                            <FormControlLabel value="Male" control={<Radio sx={{ color: !!error?.sexID ? '#ef4444' : '#4ade80', '&.Mui-checked': { color: '#4ade80' } }} />} label="Male" sx={{ color: '#e5e7eb', margin: 0 }} />
                            <FormControlLabel value="Other" control={<Radio sx={{ color: !!error?.sexID ? '#ef4444' : '#4ade80', '&.Mui-checked': { color: '#4ade80' } }} />} label="Other" sx={{ color: '#e5e7eb', margin: 0 }} />
                        </RadioGroup>
                    </div>
                    {error?.sexID && <span className="gender-error-text">{error.sexID}</span>}
                </FormControl>

                <div className="upload-container pb-2 flex flex-col items-center">
                    <span className="upload-title mb-3">Character Photo</span>
                    
                    <div className="flex bg-slate-900/80 rounded-lg p-0.5 mb-4 w-full max-w-[200px] border border-white/10 mx-auto">
                        <button type="button" onClick={() => setUploadMode('file')} className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all duration-300 ${uploadMode === 'file' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                            <FaCloudUploadAlt className="text-xs" /> File
                        </button>
                        <button type="button" onClick={() => setUploadMode('url')} className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all duration-300 ${uploadMode === 'url' ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-[0_0_12px_rgba(217,70,239,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                            <FaLink className="text-xs" /> URL
                        </button>
                    </div>

                    <div className="flex flex-col items-center w-full min-h-40 justify-start">
                        {uploadMode === 'file' ? (
                            <div className="relative w-36 h-36 rounded-full border-2 border-dashed border-slate-600 hover:border-cyan-400 overflow-hidden group transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-slate-900/50 flex items-center justify-center">
                                <img 
                                    src={character.imgFile ? URL.createObjectURL(character.imgFile) : (character.imgUrl || LOGO)} 
                                    alt="Character Avatar" 
                                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:opacity-30" 
                                />
                                <Button component="label" className="absolute! inset-0! w-full! h-full! min-w-0! !p-0! rounded-full! cursor-pointer">
                                    <VisuallyHiddenInput type="file" onChange={handleImageChange} accept="image/*" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <FaCloudUploadAlt className="text-4xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] mb-1" />
                                        <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">Upload</span>
                                    </div>
                                </Button>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col gap-4 items-center">
                                <TextField
                                    className="modal-input-x w-full"
                                    placeholder="https://example.com/avatar.jpg"
                                    value={character.imgUrl?.startsWith('http') ? character.imgUrl : ''}
                                    onChange={handleUrlChange}
                                    fullWidth
                                    size="small"
                                    InputProps={{ style: { fontSize: 12 } }}
                                />
                                <div className="w-36 h-36 rounded-full overflow-hidden border border-white/10 bg-slate-900/50 flex items-center justify-center">
                                    {character.imgUrl?.startsWith('http') ? (
                                        <img src={character.imgUrl} className="w-full h-full object-cover" alt="Preview" onError={(e) => e.target.src = LOGO} />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-500">
                                            <FaLink className="text-3xl mb-1" />
                                            <span className="text-[10px] font-bold">Paste URL</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
            
            <DialogActions className="modal-actions-x p-6 w-full flex flex-col">
                {loading ? (
                    <div className="w-full bg-slate-900/40 p-4 rounded-xl border border-white/10 shadow-inner">
                        <div className="flex justify-between text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                            <span className="animate-pulse">Syncing Data...</span>
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
                        <Button onClick={addcharacter} disabled={loading} className="btn-submit-x">
                            {character.id ? "UPDATE" : "ADD"}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}
