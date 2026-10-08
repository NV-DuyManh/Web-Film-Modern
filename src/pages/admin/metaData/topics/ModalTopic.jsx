import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, Slide, TextField, Select, MenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import { useMovies } from '../../../../hooks/useCollections';
import React, { useContext } from 'react';
import { FaTimes } from 'react-icons/fa';


const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});



const GRADIENT_OPTIONS = [
    { value: 'from-purple-500 to-indigo-600', label: 'Tím - Xanh indigo' },
    { value: 'from-orange-500 via-red-500 to-rose-600', label: 'Cam - Đỏ' },
    { value: 'from-amber-400 via-yellow-500 to-orange-500', label: 'Vàng - Cam' },
    { value: 'from-pink-500 via-fuchsia-500 to-purple-600', label: 'Hồng - Tím' },
    { value: 'from-sky-400 via-blue-500 to-indigo-600', label: 'Xanh dương' },
    { value: 'from-emerald-400 via-teal-500 to-cyan-600', label: 'Xanh ngọc' },
    { value: 'from-lime-400 via-green-500 to-emerald-600', label: 'Xanh lá' },
];

function ModalTopic({ open, handleClose, topic, onChangeInput, onChangeMovieSelection, error, addTopic, loading, progress }) {
    const movies = useMovies() || [];

    const selectedMovies = topic.movieID?.map(id => movies.find(m => m.id === id)).filter(Boolean) || [];

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
                    {topic.id ? 'Update Topic' : 'Add New Topic'}
                </p>
                <button 
                    onClick={handleClose}
                    className="w-8 h-8 shrink-0 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] hover:scale-110 transition-all duration-300 group cursor-pointer"
                >
                    <FaTimes size={16} className="transition-transform duration-200 group-hover:rotate-180 group-hover:scale-125" style={{ strokeWidth: '1.5', stroke: 'currentColor' }} />
                </button>
            </DialogTitle>
            
            <DialogContent className="modal-body-x py-8 px-6">
                <TextField
                    className="modal-input-x"
                    variant="outlined"
                    name="title"
                    onChange={onChangeInput}
                    fullWidth
                    label="Topic Title"
                    value={topic.title || topic.name || ""}
                    error={!!error?.title}
                    helperText={error?.title}
                />
                <TextField
                    className="modal-input-x"
                    variant="outlined"
                    name="description"
                    onChange={onChangeInput}
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={topic.description || ""}
                    error={!!error?.description}
                    helperText={error?.description}
                />
                
                <div className="mt-4">
                    <TextField
                        select
                        fullWidth
                        className="modal-input-x"
                        name="gradient"
                        value={topic.gradient || 'from-purple-500 to-indigo-600'}
                        label="Gradient Color"
                        onChange={onChangeInput}
                    >
                        {GRADIENT_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value} style={{ color: 'white' }}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded bg-linear-to-br ${opt.value}`}></div>
                                    {opt.label}
                                </div>
                            </MenuItem>
                        ))}
                    </TextField>
                </div>

                {!topic.isSmart && (
                    <Autocomplete
                        multiple
                        options={movies}
                        getOptionLabel={(option) => option.name || option.otherName || ""}
                        value={selectedMovies}
                        classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                        onChange={(event, newValue) => {
                            onChangeMovieSelection(newValue.map(m => m.id));
                        }}
                        filterSelectedOptions
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Search and select movies"
                                className="modal-input-x"
                            />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return (
                                    <Chip 
                                        key={key} 
                                        variant="outlined" 
                                        label={option.name} 
                                        {...tagProps} 
                                        className="text-cyan-400! border-cyan-400!/30 bg-cyan-500!/10 mr-1! mt-1!"
                                        sx={{
                                            '& .MuiChip-deleteIcon': {
                                                color: '#ef4444',
                                                '&:hover': {
                                                    color: '#f87171',
                                                }
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    />
                )}
            </DialogContent>

            <DialogActions className="modal-actions-x p-6 w-full flex flex-col">
                {loading ? (
                    <div className="w-full bg-slate-900/40 p-4 rounded-xl border border-white/10 shadow-inner">
                        <div className="flex justify-between text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                            <p className="animate-pulse inline">Syncing to Cloud Database...</p>
                            <p className="inline">{progress}%</p>
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
                        <Button disabled={loading} onClick={addTopic} className="btn-submit-x">
                            {topic.id ? "UPDATE" : "ADD"}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default ModalTopic;
