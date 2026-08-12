import React, { useRef, useEffect } from 'react';
import { IoWarningOutline } from 'react-icons/io5';

function ModalDelete({ isOpen, onClose, onConfirm, title, message }) {
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
            className="bg-[#1e293b] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop:bg-black/70 p-0 border border-slate-700/60 m-auto backdrop-blur-sm"
            onCancel={onClose}
        >
            <div className="p-8 w-87.5 md:w-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <IoWarningOutline className="text-red-500 text-4xl" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">{title || 'Xác nhận xóa?'}</h3>
                <p className="text-slate-400 text-sm mb-8">{message || 'Bạn có chắc chắn muốn xóa không? Hành động này không thể hoàn tác.'}</p>
                
                <div className="flex items-center gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-white font-semibold transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow-[0_4px_15px_rgba(239,68,68,0.3)]"
                    >
                        Xóa
                    </button>
                </div>
            </div>
        </dialog>
    );
}

export default ModalDelete;
