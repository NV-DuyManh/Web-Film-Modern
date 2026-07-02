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
            <DialogTitle 
                className="modal-header-x" 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    background: 'linear-gradient(90deg, #ef4444, #ec4899)'
                }}
            >
                <FiAlertTriangle size={22} style={{ color: '#ffffff' }} />
                <span>{titleDelete}</span>
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

            <DialogActions className="modal-actions-x p-4 flex flex-col w-full">
                {isDeleting ? (
                    <div className="w-full bg-slate-900/60 p-4 rounded-xl border border-red-500/30 shadow-inner mt-2 mb-2">
                        <div className="flex justify-between text-xs font-bold text-red-400 mb-2 uppercase tracking-wider">
                            <span className="animate-pulse">Deleting Data...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                            <div 
                                className="bg-linear-to-r from-red-500 via-rose-500 to-orange-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex justify-end gap-3 pt-2">
                        <Button 
                            onClick={handleClose} 
                            className="btn-neutral-x"
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={onConfirmDelete} 
                            className="btn-danger-x"
                            disabled={isDeleting}
                        >
                            Delete
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}