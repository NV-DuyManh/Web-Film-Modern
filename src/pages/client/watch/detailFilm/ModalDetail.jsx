import React from 'react';
import { Dialog, Slide } from '@mui/material';
import { FaLock } from 'react-icons/fa';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

function ModalDetail({ open, handleClose, title = "Yêu cầu đăng nhập", description = "Bạn cần đăng nhập tài khoản để mua hoặc thuê phim này" }) {
    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            disableScrollLock={true}
            PaperProps={{ style: { background: 'transparent', boxShadow: 'none', overflow: 'visible', borderRadius: 24 } }}
        >
            <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a2035, #0f1322)' }}>
                <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(250,204,21,0.4), transparent, rgba(244,63,94,0.4), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'borderGlow 4s linear infinite',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    padding: '2px',
                }} />

                <div className="relative z-10 flex flex-col items-center text-center px-8 py-10 gap-5">
                    <div className="w-18 h-18 rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.15)]">
                        <FaLock className="text-yellow-400 text-2xl" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
                    </div>

                    <div className="flex gap-3 w-full mt-2">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-5 py-2.5 rounded-full font-bold text-sm text-slate-300 bg-slate-700/50 border border-slate-600/50 hover:bg-slate-600/50 hover:text-white transition cursor-pointer"
                        >
                            Để sau
                        </button>
                        <button
                            onClick={() => {
                                handleClose();
                                window.dispatchEvent(new CustomEvent('openLoginModal'));
                            }}
                            className="flex-1 px-5 py-2.5 rounded-full font-bold text-sm text-black bg-yellow-400 hover:bg-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:shadow-[0_0_20px_rgba(250,204,21,0.5)] transition cursor-pointer"
                        >
                            🔑 Đăng nhập ngay
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

export default ModalDetail;
