// src/components/admin/ModalChoose.jsx
import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { FaSearch } from 'react-icons/fa';
import { searchTV } from './search/SearchTV';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalChoose({ handleClickChoose, handleCloseChoose, openChoose, dataChoose, type, selectedItems = [] }) {
    const [searchTerm, setSearchTerm] = React.useState('');

    // Reset search term when modal opens
    React.useEffect(() => {
        if (openChoose) {
            setSearchTerm('');
        }
    }, [openChoose]);

    const filteredData = React.useMemo(() => {
        if (!searchTerm) return dataChoose;
        const normalizedSearchTerm = searchTV(searchTerm);
        return dataChoose?.filter(item => 
            searchTV(item.name).includes(normalizedSearchTerm)
        );
    }, [dataChoose, searchTerm]);

    return (
        <Dialog
            open={openChoose}
            slots={{ transition: Transition }}
            keepMounted
            onClose={handleCloseChoose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ className: "!bg-slate-900 !border !border-cyan-500/30 !rounded-2xl !shadow-[0_0_40px_rgba(6,182,212,0.25)] overflow-hidden" }}
        >
            <DialogTitle className="!bg-slate-800 !bg-gradient-to-b !from-cyan-900/60 !to-cyan-900/10 !border-b !border-cyan-400/60 !shadow-[0_5px_20px_-5px_rgba(34,211,238,0.4)] flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 gap-4 relative z-10">
                <span className="font-black uppercase tracking-widest text-sm flex items-center">
                    <span className="glow-text-multi">Choose {type}</span>
                </span>
                
                <div className="relative w-full sm:w-1/2 group">
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/80 border border-yellow-400/40 text-yellow-100 text-xs rounded-full pl-9 pr-4 py-2 focus:outline-none focus:bg-slate-800 focus:border-yellow-400 focus:shadow-[0_0_20px_rgba(250,204,21,0.5),inset_0_0_10px_rgba(250,204,21,0.3)] transition-all placeholder-yellow-400/60 hover:border-yellow-400/70 hover:bg-slate-800 hover:shadow-[0_0_10px_rgba(250,204,21,0.2)] shadow-[inset_0_0_8px_rgba(250,204,21,0.1)]"
                    />
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-yellow-400 group-hover:text-yellow-200 group-focus-within:text-yellow-300 group-focus-within:animate-pulse transition-all text-xs drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                </div>
            </DialogTitle>
            
            <DialogContent className="p-6 !bg-slate-900 custom-scrollbar overflow-y-auto" style={{ maxHeight: '60vh' }}>
                <div className="flex gap-4 flex-wrap justify-center mt-2">
                    {filteredData?.length > 0 ? filteredData.map((item) => {
                        const isSelected = selectedItems.includes(item.id);
                        return type === "categoryTypes" || type === "categories" ? (
                            <button
                                key={item.id}
                                onClick={() => handleClickChoose(item.id)}
                                className={`px-5 py-2 rounded-xl text-xs transition-all font-bold tracking-wider flex items-center gap-2 ${isSelected
                                        ? "text-cyan-100 bg-cyan-500/20 border border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5),inset_0_0_10px_rgba(34,211,238,0.3)] scale-105"
                                        : "text-slate-200 bg-slate-800 border border-slate-600 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                    }`}
                            >
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]"></span>}
                                {item.name}
                            </button>
                        ) : (
                            <div
                                key={item.id}
                                onClick={() => handleClickChoose(item.id)}
                                className={`cursor-pointer flex flex-col items-center justify-start gap-2 transition-all p-1 rounded-xl h-24 ${isSelected
                                        ? "scale-110 opacity-100"
                                        : "opacity-90 hover:opacity-100 hover:scale-105"
                                    }`}
                                style={{ width: '80px' }}
                            >
                                <img
                                    className={`w-14 h-14 rounded-full object-cover transition-all ${isSelected
                                            ? "ring-[3px] ring-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.7)]"
                                            : "ring-2 ring-transparent shadow-md"
                                        }`}
                                    src={item.imgUrl}
                                    alt={item.name}
                                />
                                <h1 className={`text-[10px] font-bold text-center w-full leading-tight ${isSelected ? "text-fuchsia-300 drop-shadow-[0_0_5px_rgba(217,70,239,0.9)] line-clamp-2" : "text-slate-300 line-clamp-2"}`} title={item.name}>
                                    {item.name}
                                </h1>
                            </div>
                        );
                    }) : (
                        <div className="w-full text-center py-10 text-slate-600 font-medium text-sm">
                            No {type} found matching "{searchTerm}"
                        </div>
                    )}
                </div>
            </DialogContent>
            
            <DialogActions className="!bg-slate-800 !bg-gradient-to-t !from-fuchsia-900/40 !to-fuchsia-900/10 !border-t !border-fuchsia-400/50 !shadow-[0_-5px_20px_-5px_rgba(217,70,239,0.3)] p-4 relative z-10">
                <div className="text-xs text-slate-500 mr-auto font-medium ml-2 uppercase tracking-widest">
                    Selected: <span className="text-fuchsia-400 font-black drop-shadow-[0_0_5px_rgba(217,70,239,0.5)] text-sm ml-1">{selectedItems.length}</span>
                </div>
                <Button onClick={handleCloseChoose} className="!bg-gradient-to-r !from-fuchsia-600 !to-pink-500 !text-white !px-8 !py-2 !rounded-xl !text-xs !font-bold !tracking-widest hover:!scale-105 hover:!shadow-[0_0_20px_rgba(217,70,239,0.6)] !transition-all">
                    DONE
                </Button>
            </DialogActions>
        </Dialog>
    );
}
