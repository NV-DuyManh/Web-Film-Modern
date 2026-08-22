import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { FaSearch, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { searchTV } from './search/SearchTV';
import { getSafeEntityAvatar, getDefaultAvatar } from '../../utils/appUtils';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function getEntityTheme(entityType) {
    switch (entityType) {
        case "authors":
            return {
                hoverBorder: "group-hover:border-yellow-400 group-hover:ring-2 group-hover:ring-yellow-400/80 group-hover:shadow-[0_0_20px_rgba(250,204,21,0.8)]",
                hoverText: "group-hover:text-yellow-300 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]",
                selectedRing: "ring-[3px] ring-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.9)] border-yellow-300",
                selectedText: "text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]",
                badgeBg: "bg-yellow-400 text-slate-950",
                baseBorder: "border border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]",
            };
        case "actors":
            return {
                hoverBorder: "group-hover:border-pink-400 group-hover:ring-2 group-hover:ring-pink-400/80 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.8)]",
                hoverText: "group-hover:text-pink-300 group-hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]",
                selectedRing: "ring-[3px] ring-pink-400 shadow-[0_0_25px_rgba(236,72,153,0.9)] border-pink-300",
                selectedText: "text-pink-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.9)]",
                badgeBg: "bg-pink-500 text-white",
                baseBorder: "border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]",
            };
        case "characters":
            return {
                hoverBorder: "group-hover:border-green-400 group-hover:ring-2 group-hover:ring-green-400/80 group-hover:shadow-[0_0_20px_rgba(74,222,128,0.8)]",
                hoverText: "group-hover:text-green-300 group-hover:drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]",
                selectedRing: "ring-[3px] ring-green-400 shadow-[0_0_25px_rgba(74,222,128,0.9)] border-green-300",
                selectedText: "text-green-300 drop-shadow-[0_0_8px_rgba(74,222,128,0.9)]",
                badgeBg: "bg-green-400 text-slate-950",
                baseBorder: "border border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]",
            };
        default:
            return {
                hoverBorder: "group-hover:border-cyan-400 group-hover:ring-2 group-hover:ring-cyan-400/80 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.8)]",
                hoverText: "group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]",
                selectedRing: "ring-[3px] ring-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.9)] border-cyan-300",
                selectedText: "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]",
                badgeBg: "bg-cyan-400 text-slate-950",
                baseBorder: "border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]",
            };
    }
}

function ModalChoose({ handleSaveChoose, handleClickChoose, handleCloseChoose, openChoose, dataChoose, type, selectedItems = [] }) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [tempSelected, setTempSelected] = React.useState([]);

    React.useEffect(() => {
        if (openChoose) {
            setSearchTerm('');
            setTempSelected(Array.isArray(selectedItems) ? [...selectedItems] : []);
        }
    }, [openChoose, selectedItems]);

    const filteredData = React.useMemo(() => {
        if (!searchTerm) return dataChoose;
        const normalizedSearchTerm = searchTV(searchTerm);
        return dataChoose?.filter(item => 
            searchTV(item.name).includes(normalizedSearchTerm)
        );
    }, [dataChoose, searchTerm]);

    const handleItemToggle = (id) => {
        setTempSelected(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleDone = () => {
        if (handleSaveChoose) {
            handleSaveChoose(tempSelected);
        } else if (handleClickChoose) {
            tempSelected.forEach(id => {
                if (!selectedItems.includes(id)) handleClickChoose(id);
            });
            selectedItems.forEach(id => {
                if (!tempSelected.includes(id)) handleClickChoose(id);
            });
        }
        handleCloseChoose();
    };

    const theme = getEntityTheme(type);

    return (
        <Dialog
            open={openChoose}
            slots={{ transition: Transition }}
            keepMounted
            onClose={handleCloseChoose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ className: "bg-slate-900! !border border-cyan-500!/30 rounded-2xl! !shadow-[0_0_40px_rgba(6,182,212,0.25)] overflow-hidden" }}
        >
            <DialogTitle className="bg-slate-800! bg-linear-to-b! from-cyan-900/60! to-cyan-900/10! border-b! border-cyan-400/60! shadow-[0_5px_20px_-5px_rgba(34,211,238,0.4)]! flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 gap-4 relative z-10">
                <div className="font-black uppercase tracking-widest text-sm flex items-center justify-between w-full sm:w-auto">
                    <p className="glow-text-multi inline">Choose {type}</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-1/2">
                    <div className="relative w-full group">
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800/80 border border-yellow-400/40 text-yellow-100 text-xs rounded-full pl-9 pr-4 py-2 focus:outline-none focus:bg-slate-800 focus:border-yellow-400 focus:shadow-[0_0_20px_rgba(250,204,21,0.5),inset_0_0_10px_rgba(250,204,21,0.3)] transition placeholder-yellow-400/60 hover:border-yellow-400/70 hover:bg-slate-800 hover:shadow-[0_0_10px_rgba(250,204,21,0.2)] shadow-[inset_0_0_8px_rgba(250,204,21,0.1)]"
                        />
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-yellow-400 group-hover:text-yellow-200 group-focus-within:text-yellow-300 group-focus-within:animate-pulse transition text-xs drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                    </div>
                    <button
                        onClick={handleCloseChoose}
                        className="text-slate-400 hover:text-rose-400 hover:scale-110 p-1.5 rounded-full hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Cancel / Close"
                    >
                        <FaTimes className="text-sm" />
                    </button>
                </div>
            </DialogTitle>
            
            <DialogContent className="p-6 bg-slate-900! custom-scrollbar overflow-y-auto" style={{ maxHeight: '60vh' }}>
                <div className="flex gap-4 flex-wrap justify-center mt-2">
                    {filteredData?.length > 0 ? filteredData.map((item) => {
                        const isSelected = tempSelected.includes(item.id);
                        return type === "categoryTypes" || type === "categories" ? (
                            <button
                                key={item.id}
                                onClick={() => handleItemToggle(item.id)}
                                className={`px-5 py-2.5 rounded-xl text-xs transition-all duration-300 font-bold tracking-wider flex items-center gap-2 cursor-pointer ${isSelected
                                        ? "text-cyan-100 bg-cyan-500/25 border border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6),inset_0_0_10px_rgba(34,211,238,0.4)] scale-105"
                                        : "text-slate-200 bg-slate-800/90 border border-slate-600/80 hover:text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20 hover:scale-105 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                    }`}
                            >
                                {isSelected && <p className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] inline"></p>}
                                {item.name}
                            </button>
                        ) : (
                            <div
                                key={item.id}
                                onClick={() => handleItemToggle(item.id)}
                                className={`group cursor-pointer flex flex-col items-center justify-start gap-2 p-1.5 rounded-2xl transition-all duration-300 relative ${isSelected
                                        ? "scale-110 opacity-100 bg-white/5"
                                        : "opacity-85 hover:opacity-100 hover:scale-110 hover:-translate-y-1 hover:bg-white/5"
                                    }`}
                                style={{ width: '84px' }}
                            >
                                <div className="relative">
                                    <img
                                        className={`w-14 h-14 rounded-full object-cover transition-all duration-300 ${isSelected
                                                ? theme.selectedRing
                                                : `${theme.baseBorder} ${theme.hoverBorder}`
                                            }`}
                                        src={getSafeEntityAvatar(item.imgUrl, item.sexID)}
                                        alt={item.name}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = getDefaultAvatar(item.sexID);
                                        }}
                                    />
                                    {isSelected && (
                                        <div className={`absolute -top-1 -right-1 ${theme.badgeBg} rounded-full p-0.5 shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse`}>
                                            <FaCheckCircle className="text-xs" />
                                        </div>
                                    )}
                                </div>
                                <h1 
                                    className={`text-[11px] font-bold text-center w-full leading-tight line-clamp-2 transition-all duration-300 ${isSelected 
                                        ? theme.selectedText 
                                        : `text-slate-300 ${theme.hoverText}`
                                    }`} 
                                    title={item.name}
                                >
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
            
            <DialogActions className="bg-slate-800! bg-linear-to-t! from-fuchsia-900/40! to-fuchsia-900/10! border-t! border-fuchsia-400/50! shadow-[0_-5px_20px_-5px_rgba(217,70,239,0.3)]! p-4 relative z-10 flex justify-between items-center">
                <div className="text-xs text-slate-400 font-medium ml-2 uppercase tracking-widest">
                    Selected: <span className="text-fuchsia-400 font-black drop-shadow-[0_0_5px_rgba(217,70,239,0.5)] text-sm ml-1 inline">{tempSelected.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleCloseChoose} className="text-slate-400! hover:text-white! hover:bg-slate-800! px-4! py-2! rounded-xl! text-xs! font-bold! tracking-wider! transition!">
                        CANCEL
                    </Button>
                    <Button onClick={handleDone} className="bg-linear-to-r! from-fuchsia-600! to-pink-500! text-white! px-8! py-2! rounded-xl! text-xs! font-bold! tracking-widest! hover:scale-105! hover:shadow-[0_0_20px_rgba(217,70,239,0.6)]! transition!">
                        DONE
                    </Button>
                </div>
            </DialogActions>
        </Dialog>
    );
}

export default ModalChoose;
