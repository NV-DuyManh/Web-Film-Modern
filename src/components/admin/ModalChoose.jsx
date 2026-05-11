// src/components/admin/ModalChoose.jsx
import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalChoose({ handleClickChoose, handleCloseChoose, openChoose, dataChoose, type, selectedItems = [] }) {
    return (
        <Dialog
            open={openChoose}
            slots={{ transition: Transition }}
            keepMounted
            onClose={handleCloseChoose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ className: "modal-inner" }}
        >
            <DialogTitle className="modal-header-x text-white uppercase tracking-wider">Choose {type}</DialogTitle>
            <DialogContent className="modal-body-x p-6">
                <div className="flex gap-4 flex-wrap mt-4 justify-center">
                    {dataChoose?.map((item) => {
                        const isSelected = selectedItems.includes(item.id);

                        return type === "categoryTypes" ? (
                            <button 
                                key={item.id} 
                                onClick={() => handleClickChoose(item.id)} 
                                className={`px-5 py-2.5 rounded-xl border transition-all font-bold tracking-wide shadow-md ${
                                    isSelected 
                                        ? "bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]" 
                                        : "bg-slate-800 text-gray-200 border-slate-600 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/50"
                                }`}
                            >
                                {item.name}
                            </button>
                        ) : (
                            <div 
                                key={item.id} 
                                onClick={() => handleClickChoose(item.id)} 
                                className={`cursor-pointer flex flex-col items-center gap-2 transition-transform ${
                                    isSelected 
                                        ? "scale-110" 
                                        : "hover:scale-110 opacity-70 hover:opacity-100"
                                }`}
                            >
                                <img 
                                    className={`w-16 h-16 rounded-full object-cover transition-all ${
                                        isSelected 
                                            ? "ring-4 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" 
                                            : "shadow-md"
                                    }`} 
                                    src={item.imgUrl} 
                                    alt={item.name} 
                                />
                                <h1 className={`text-xs font-bold text-center max-w-20 truncate ${isSelected ? "text-cyan-400" : "text-gray-200"}`}>
                                    {item.name}
                                </h1>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
            <DialogActions className="modal-actions-x">
                <Button onClick={handleCloseChoose} className="btn-submit-x">Done</Button>
            </DialogActions>
        </Dialog>
    );
}