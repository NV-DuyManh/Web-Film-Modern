import { FaTimes } from 'react-icons/fa';
import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Slide } from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function ModalEpisodes({ open, onChangeInput, handleClose, addEpisode, addBulkEpisodes, error, loading, progress, episode, setEpisode, isBulkMode, setIsBulkMode, bulkTarget, setBulkTarget, bulkText, setBulkText, selectedMovie }) {

    const handleNumberChange = (e) => {
        const onlyNums = e.target.value.replace(/[^0-9]/g, '');
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
            <DialogTitle className="modal-header-x flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6!">
                <div className="flex items-center gap-4">
                    <p className="glow-text-gold text-xl md:text-2xl font-black tracking-tight inline m-0" style={{ paddingBottom: '0.1em' }}>
                        {episode.id  ? "Update Episode" : "Add New Episode"}
                    </p>
                    
                    {!episode.id && (
                        <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/10 mt-1 md:mt-0">
                            <button
                                onClick={() => setIsBulkMode(false)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!isBulkMode ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-400 hover:text-white'}`}
                            >
                                Single
                            </button>
                            <button
                                onClick={() => setIsBulkMode(true)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${isBulkMode ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-400 hover:text-white'}`}
                            >
                                Bulk Add
                            </button>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleClose}
                    className="w-8 h-8 shrink-0 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] hover:scale-110 transition-all duration-300 group cursor-pointer mt-2 md:mt-0"
                >
                    <FaTimes size={16} className="transition-transform duration-200 group-hover:rotate-180 group-hover:scale-125" style={{ strokeWidth: '1.5', stroke: 'currentColor' }} />
                </button>
            </DialogTitle>

            <DialogContent className="modal-body-x pt-6!">
                <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-xl p-4 flex flex-col">
                    <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">Target Movie</span>
                    <span className="text-white font-medium">{selectedMovie?.name}</span>
                </div>
                
                {isBulkMode && !episode.id ? (
                    <div className="mt-4">
                        <div className="flex gap-2 mb-4 items-center">
                            <span className="text-sm font-bold text-slate-300 mr-2">Target:</span>
                            <button onClick={() => setBulkTarget('1')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${bulkTarget === '1' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'}`}>Server 1</button>
                            <button onClick={() => setBulkTarget('2')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${bulkTarget === '2' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'}`}>Server 2</button>
                            <button onClick={() => setBulkTarget('both')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${bulkTarget === 'both' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'}`}>Both</button>
                        </div>
                        <label className="text-sm font-bold text-slate-300 mb-2 block">
                            Bulk Episode Format {bulkTarget === 'both' ? '(Tập 01|URL 1|URL 2)' : '(Tập 01|URL)'}
                        </label>
                        <textarea
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-xl p-4 text-slate-300 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono resize-none"
                            placeholder={bulkTarget === 'both' ? "Tập 01|https://link-m3u8...|https://link-embed...\nTập 02|https://link-m3u8...|https://link-embed..." : "Tập 01|https://link...\nTập 02|https://link..."}
                        />
                    </div>
                ) : (
                    <>
                        <TextField
                            className="modal-input-x"
                            name="numberEpisode"
                            onChange={handleNumberChange}
                            fullWidth
                            label="Episode Number"
                            variant="outlined"
                            value={episode.numberEpisode}
                            helperText={error.numberEpisode}
                            error={!!error.numberEpisode}
                        />

                        <TextField
                            className="modal-input-x"
                            name="url"
                            onChange={onChangeInput}
                            fullWidth
                            label="Video URL (Server 1)"
                            variant="outlined"
                            value={episode.url}
                            helperText={error.url}
                            error={!!error.url}
                        />

                        <TextField
                            className="modal-input-x"
                            name="url2"
                            onChange={onChangeInput}
                            fullWidth
                            label="Backup Video URL (Server 2 - Optional)"
                            variant="outlined"
                            value={episode.url2 || ''}
                        />
                    </>
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
                        <Button disabled={loading} onClick={isBulkMode && !episode.id ? addBulkEpisodes : addEpisode} className="btn-submit-x">
                            {episode.id ? "Save Changes" : (isBulkMode ? "Bulk Import" : "Add Episode")}
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default ModalEpisodes;
