import React, { useRef, useEffect, useState } from 'react';
import { FaLayerGroup } from 'react-icons/fa';

function ModalListFilm({ isOpen, onClose, onConfirm, title, placeholder, defaultValue, confirmText, confirmColor }) {
    const dialogRef = useRef(null);
    const inputRef = useRef(null);
    const [value, setValue] = useState(defaultValue || '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue || '');
            setError('');
            dialogRef.current?.showModal();
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen, defaultValue]);

    const handleSubmit = () => {
        if (!value.trim()) {
            setError('Bạn cần nhập tên danh sách!');
            inputRef.current?.focus();
            return;
        }
        onConfirm(value.trim());
        setValue('');
        setError('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    const colorMap = {
        cyan: {
            icon: 'from-cyan-500 to-blue-500',
            iconGlow: 'shadow-[0_0_25px_rgba(34,211,238,0.4)]',
            title: 'from-cyan-400 to-blue-400',
            border: 'border-cyan-500/30',
            inputFocus: 'focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)]',
            btn: 'from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-[0_4px_20px_rgba(34,211,238,0.3)] hover:shadow-[0_4px_25px_rgba(34,211,238,0.5)]',
        },
        yellow: {
            icon: 'from-yellow-400 to-amber-500',
            iconGlow: 'shadow-[0_0_25px_rgba(250,204,21,0.4)]',
            title: 'from-yellow-300 to-amber-400',
            border: 'border-yellow-500/30',
            inputFocus: 'focus:border-yellow-400 focus:shadow-[0_0_15px_rgba(250,204,21,0.3)]',
            btn: 'from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 shadow-[0_4px_20px_rgba(250,204,21,0.3)] hover:shadow-[0_4px_25px_rgba(250,204,21,0.5)] text-black!',
        },
    };

    const c = colorMap[confirmColor] || colorMap.cyan;

    return (
        <dialog
            ref={dialogRef}
            className={`bg-[#0f172a]/95 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop:bg-black/70 backdrop:backdrop-blur-sm p-0 border ${c.border} m-auto max-w-none`}
            onCancel={onClose}
            onClick={(e) => e.target === dialogRef.current && onClose()}
        >
            <div className="p-8 w-87.5 md:w-100 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${c.icon} flex items-center justify-center mb-5 ${c.iconGlow}`}>
                    <FaLayerGroup className="text-white text-2xl drop-shadow-lg" />
                </div>

                <h3 className={`text-2xl font-black mb-6 bg-linear-to-r ${c.title} text-transparent bg-clip-text`}>
                    {title || 'Nhập thông tin'}
                </h3>

                <div className="w-full mb-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => { setValue(e.target.value); setError(''); }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || 'Nhập tên...'}
                        className={`w-full bg-slate-800/80 border border-slate-600/80 text-white text-sm rounded-xl py-3.5 px-4 focus:outline-none transition duration-300 placeholder:text-slate-500 ${c.inputFocus}`}
                    />
                    {error && (
                        <p className="text-red-400 text-xs mt-2 text-left font-medium">{error}</p>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 hover:text-white font-bold transition duration-300 text-sm"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`flex-1 py-3 rounded-xl bg-linear-to-r ${c.btn} text-white font-bold transition duration-300 text-sm hover:scale-[1.02] active:scale-95`}
                    >
                        {confirmText || 'Xác nhận'}
                    </button>
                </div>
            </div>
        </dialog>
    );
}

export default ModalListFilm;
