import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FiAlertTriangle } from 'react-icons/fi';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ModalDelete({ handleClose, open, handleDeleted, titleDelete, contentDelete }) {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    const onConfirmDelete = async () => {
        setIsDeleting(true);
        setProgress(65);
        
        const interval = setInterval(() => {
            setProgress((prev) => (prev < 90 ? prev + 5 : prev));
        }, 150);

        try {
            await handleDeleted();
            setProgress(100);
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            clearInterval(interval);
            setTimeout(() => {
                setIsDeleting(false);
                setProgress(0);
            }, 600); // Give time for 100% animation to show
        }
    };

    React.useEffect(() => {
        if (!open) {
            const timeout = setTimeout(() => {
                setIsDeleting(false);
                setProgress(0);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            slots={{ transition: Transition }}
            keepMounted
            onClose={!isDeleting ? handleClose : undefined}
            className="modal-wrapper"
            PaperProps={{ className: "modal-inner" }}
            BackdropProps={{ className: "modal-backdrop-x" }}
        >
            <DialogTitle className="modal-header-danger flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-full border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                        <FiAlertTriangle size={22} className="text-red-400" />
                    </div>
                    <span className="text-red-400 font-black text-xl md:text-2xl tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] uppercase">
                        {titleDelete}
                    </span>
                </div>
                <button 
                    onClick={!isDeleting ? handleClose : undefined}
                    className="w-10 h-10 shrink-0 rounded-full bg-red-500/10 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-500 hover:text-white hover:border-red-500 hover:bg-red-500 hover:rotate-90 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] transition-all duration-300 cursor-pointer disabled:opacity-50"
                    disabled={isDeleting}
                >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"></path></svg>
                </button>
            </DialogTitle>

            <DialogContent className="modal-body-x">
                <DialogContentText style={{ color: '#e5e7eb', paddingTop: '10px', fontSize: '16px' }}>
                    {contentDelete}
                </DialogContentText>
                <DialogContentText style={{ color: '#f87171', paddingTop: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiAlertTriangle size={14} />
                    This action cannot be undone. Are you sure you want to proceed?
                </DialogContentText>
            </DialogContent>

            <DialogActions className="modal-actions-danger p-5 flex flex-col w-full">
                {isDeleting ? (
                    <div className="w-full bg-slate-900/80 p-4 rounded-xl border border-red-500/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] mt-2 mb-2">
                        <div className="flex justify-between text-xs font-bold text-red-400 mb-2 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
                            <span className="animate-pulse">Deleting Data...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-black/80 rounded-full h-3 overflow-hidden p-[2px] border border-red-500/20">
                            <div 
                                className="bg-linear-to-r from-red-600 via-rose-500 to-orange-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(239,68,68,1)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex justify-end gap-3 pt-2">
                        <Button 
                            onClick={handleClose} 
                            className="btn-cancel-slate"
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={onConfirmDelete} 
                            className="btn-delete"
                            disabled={isDeleting}
                        >
                            Delete Now
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}
