import React, { useRef, useEffect } from 'react';
import { IoWarningOutline } from 'react-icons/io5';

function ModalDeleteListFilm({ isOpen, onClose, onConfirm, title, message }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    return (
        <dialog
            ref={dialogRef}
            className="bg-[#0f172a]/95 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop:bg-black/70 backdrop:backdrop-blur-sm p-0 border border-red-500/20 m-auto max-w-none"
            onCancel={onClose}
            onClick={(e) => e.target === dialogRef.current && onClose()}
        >
            <div className="p-8 w-87.5 md:w-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-red-500 to-rose-600 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(239,68,68,0.4)]">
                    <IoWarningOutline className="text-white text-3xl drop-shadow-lg" />
                </div>

                <h3 className="text-2xl font-black mb-2 bg-linear-to-r from-red-400 to-rose-400 text-transparent bg-clip-text">
                    {title || 'Xác nhận xóa?'}
                </h3>
                <p className="text-slate-400 text-sm mb-8">{message || 'Bạn có chắc chắn muốn xóa không? Hành động này không thể hoàn tác.'}</p>

                <div className="flex items-center gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 hover:text-white font-bold transition duration-300 text-sm"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-xl bg-linear-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold transition duration-300 shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_25px_rgba(239,68,68,0.5)] hover:scale-[1.02] active:scale-95 text-sm"
                    >
                        Xóa
                    </button>
                </div>
            </div>
        </dialog>
    );
}

export default ModalDeleteListFilm;
