import { notifyAdmin } from '../../services/adminOperations';
import * as React from 'react';
import { FaTimes } from 'react-icons/fa';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, LinearProgress } from '@mui/material';
import Slide from '@mui/material/Slide';
import { FiAlertTriangle } from 'react-icons/fi';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function ModalDelete({ handleClose, open, handleDeleted, titleDelete, contentDelete }) {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const onConfirmDelete = async () => {
        setIsDeleting(true);



        try {
            await handleDeleted();
        } catch (error) {
            notifyAdmin(error.message || "Chưa chuyển được vào thùng rác. Vui lòng thử lại.", "error");
        } finally {
            setIsDeleting(false);
        }
    };



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
                    <p className="glow-text-danger font-black text-xl md:text-2xl tracking-widest uppercase inline">
                        {titleDelete}
                    </p>
                </div>
                <button
                    onClick={!isDeleting ? handleClose : undefined}
                    className="w-8 h-8 shrink-0 rounded-full bg-slate-800/80 border border-red-500/50 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-600 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] hover:scale-110 transition duration-300 group cursor-pointer disabled:opacity-50"
                    disabled={isDeleting}
                >
                    <FaTimes size={16} className="transition-transform duration-200 group-hover:rotate-180 group-hover:scale-125" style={{ strokeWidth: '1.5', stroke: 'currentColor' }} />
                </button>
            </DialogTitle>

            <DialogContent className="modal-body-danger">
                <DialogContentText style={{ color: '#f8fafc', paddingTop: '8px', fontSize: '1.1rem', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: '1.6' }}>
                    {contentDelete}
                </DialogContentText>
                <DialogContentText style={{ color: '#fca5a5', paddingTop: '24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', letterSpacing: '0.5px' }}>
                    <FiAlertTriangle size={20} className="animate-pulse text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    Dữ liệu sẽ được chuyển vào thùng rác và có thể khôi phục trong mục Vận hành.
                </DialogContentText>
            </DialogContent>

            <DialogActions className="modal-actions-danger p-5 flex flex-col w-full">
                {isDeleting ? (
                    <div className="w-full bg-slate-900/80 p-4 rounded-xl border border-red-500/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] mt-2 mb-2">
                        <div className="flex justify-between text-xs font-bold text-red-400 mb-2 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
                            <p className="animate-pulse inline">Đang chuyển vào thùng rác...</p>

                        </div>
                        <LinearProgress color="error" aria-label="Đang chuyển vào thùng rác" />
                    </div>
                ) : (
                    <div className="w-full flex justify-end gap-3 pt-2">
                        <Button
                            onClick={handleClose}
                            className="btn-cancel-slate"
                            disabled={isDeleting}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={onConfirmDelete}
                            className="btn-submit-danger"
                            disabled={isDeleting}
                        >
                            Chuyển vào thùng rác
                        </Button>
                    </div>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default ModalDelete;
