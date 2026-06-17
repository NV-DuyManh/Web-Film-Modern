import React, { useState } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { IoClose } from 'react-icons/io5';
import { FcGoogle } from 'react-icons/fc';
import Logo2 from '../../../assets/Logo2.png';

export default function LogIn({ open, handleClose }) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableScrollLock={true}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#000000',
          backgroundImage: 'none',
        },
        '& .MuiDialogContent-root': {
          backgroundColor: '#000000',
          padding: 0,
        }
      }}
      PaperProps={{
        className: "rounded-2xl overflow-hidden bg-black text-white border border-neutral-900"
      }}
    >
      <DialogContent className="p-0 flex flex-col md:flex-row overflow-hidden">
        <div className="hidden md:flex w-1/2 bg-neutral-950 border-r border-neutral-900 flex-col justify-between p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(234,179,8,0.08)_0%,transparent_70%)] z-0" />
          <div className="relative z-10">
            <img src={Logo2} alt="MFILM" className="h-10 w-auto" />
          </div>
          <div className="relative z-10 space-y-3">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/25">
              Điện ảnh đỉnh cao
            </span>
            <h2 className="text-3xl font-bold leading-snug text-white">
              Chào mừng<br />đến với MFILM
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Trải nghiệm kho phim khổng lồ, chất lượng cao,<br />mọi lúc mọi nơi.
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 relative bg-black">
          <button
            onClick={handleClose}
            className="absolute right-5 top-5 text-neutral-600 hover:text-white transition-colors"
          >
            <IoClose size={22} />
          </button>

          <h2 className="text-2xl font-bold mb-1 text-white">
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </h2>
          <p className="text-sm mb-7 text-neutral-500">
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-yellow-400 hover:underline"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>

          <div className="space-y-3">
            {!isLogin && (
              <input
                type="text"
                placeholder="Tên hiển thị"
                className="w-full rounded-xl p-3 text-sm text-white placeholder-neutral-600 bg-neutral-950 border border-neutral-800 outline-none focus:border-yellow-400 transition-colors"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-xl p-3 text-sm text-white placeholder-neutral-600 bg-neutral-950 border border-neutral-800 outline-none focus:border-yellow-400 transition-colors"
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full rounded-xl p-3 text-sm text-white placeholder-neutral-600 bg-neutral-950 border border-neutral-800 outline-none focus:border-yellow-400 transition-colors"
            />
            {!isLogin && (
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                className="w-full rounded-xl p-3 text-sm text-white placeholder-neutral-600 bg-neutral-950 border border-neutral-800 outline-none focus:border-yellow-400 transition-colors"
              />
            )}
          </div>

          {isLogin && (
            <div className="text-right mt-2">
              <button className="text-xs text-neutral-500 hover:text-yellow-400 transition-colors">
                Quên mật khẩu?
              </button>
            </div>
          )}

          <button className="w-full font-bold py-3 mt-5 rounded-xl text-sm tracking-wide bg-yellow-400 hover:bg-yellow-500 text-black transition-all">
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-neutral-700">
            <div className="h-px flex-1 bg-neutral-900" />
            <span>Hoặc</span>
            <div className="h-px flex-1 bg-neutral-900" />
          </div>

          <button className="flex items-center justify-center gap-3 w-full font-semibold py-3 rounded-xl text-sm text-white bg-neutral-950 border border-neutral-800 hover:border-neutral-600 transition-all">
            <FcGoogle size={18} />
            {isLogin ? 'Đăng nhập với Google' : 'Đăng ký với Google'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}