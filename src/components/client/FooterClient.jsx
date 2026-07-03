import React from 'react';
import { FaApple, FaFacebookF, FaGooglePlay, FaLinkedinIn, FaStar } from 'react-icons/fa';
import Logo from '../../assets/Logo.png';
import Logo2 from '../../assets/Logo2.png';
import { SiZalo } from 'react-icons/si';

function FooterClient() {
    return (
        <footer className='relative overflow-hidden bg-[#03040a] px-6 py-12 text-white md:px-12 min-[1150px]:px-20'>
            <div className='pointer-events-none absolute -left-40 top-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl'></div>
            <div className='pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl'></div>

            <div className='relative grid w-full grid-cols-1 gap-12 min-[1150px]:grid-cols-[minmax(0,1fr)_560px] min-[1150px]:items-start min-[1150px]:gap-16'>
                <div className='w-full min-[1150px]:justify-self-start'>
                    <div className='mb-8 flex justify-center md:justify-start'>
                        <div className='inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-900/80 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(127,29,29,0.28)]'>
                            <span className='flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-yellow-300 shadow-[0_0_14px_rgba(220,38,38,0.45)]'>
                                <FaStar className='text-sm' />
                            </span>
                            Hoàng Sa & Trường Sa là của Việt Nam!
                        </div>
                    </div>

                    <div className='flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:text-left'>
                        <div className='flex items-center justify-center'>
                            <img src={Logo2} alt="MFILM" className='h-24 w-auto object-contain transition-all' />
                        </div>

                        <div className='hidden h-14 w-px bg-white/10 md:block'></div>

                        <div className='flex items-center justify-center gap-4 md:ml-2'>
                            <a href="https://zalo.me/0779534325" target="_blank" className='flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 text-lg text-white/80 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-blue-600 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]'><SiZalo className='text-3xl' /></a>

                            <a href="https://www.facebook.com/duymanhdev" target="_blank" className='flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 text-lg text-white/80 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/60 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.45)]'><FaFacebookF /></a>

                            <a href="https://www.linkedin.com/in/duymanhdev/" target="_blank" className='flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 text-lg text-white/80 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/60 hover:bg-blue-700 hover:text-white hover:shadow-[0_0_20px_rgba(29,78,216,0.45)]'><FaLinkedinIn /></a>
                        </div>
                    </div>

                    <div className='mt-8 flex flex-wrap justify-center gap-x-10 gap-y-4 text-base font-semibold text-white md:justify-start'>
                        <a href="" className='relative transition-all duration-300 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-yellow-300 after:transition-all after:duration-300 hover:text-yellow-300 hover:after:w-full'>
                            Hỏi Đáp
                        </a>

                        <a href="" className='relative transition-all duration-300 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-yellow-300 after:transition-all after:duration-300 hover:text-yellow-300 hover:after:w-full'>
                            Chính sách bảo mật
                        </a>

                        <a href="" className='relative transition-all duration-300 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-yellow-300 after:transition-all after:duration-300 hover:text-yellow-300 hover:after:w-full'>
                            Điều khoản sử dụng
                        </a>

                        <a href="" className='relative transition-all duration-300 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-yellow-300 after:transition-all after:duration-300 hover:text-yellow-300 hover:after:w-full'>
                            Giới thiệu
                        </a>
                    </div>

                    <div className='mt-6 max-w-195 text-center text-[15px] leading-7 text-gray-300 md:text-left'>
                        <p>
                            MFILM - Trang xem phim online miễn phí chất lượng cao Vietsub, thuyết minh, lồng tiếng Full HD – 4K. Kho phim mới khổng lồ gồm phim chiếu rạp, phim bộ, phim lẻ từ Việt Nam, Hàn Quốc, Trung Quốc, Thái Lan, Nhật Bản, Âu Mỹ… đa dạng thể loại.
                            <br />
                            Dịp Tết Việt Nam, RoPhim trở lại với loạt phim xuân hấp dẫn, hài Tết và siêu phẩm mới nhất, mang đến trải nghiệm giải trí trọn vẹn bên gia đình.
                        </p>

                        <p className='mt-5 text-sm font-medium tracking-wide text-gray-500'>
                            © 2026 MFILM
                        </p>
                    </div>
                </div>

                <div className='w-full min-[1150px]:justify-self-end'>
                    <div className='w-full max-w-140 rounded-3xl border border-white/10 bg-white/3 p-7 text-center shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-sm'>
                        <h2 className='text-xl font-black uppercase leading-snug tracking-wide text-gray-200 md:text-2xl'>
                            Tải ứng dụng MFILM trên thiết bị di động để trải nghiệm mượt mà hơn
                        </h2>

                        <div className='mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row'>
                            <div className='flex h-15 w-full items-center justify-center gap-3 rounded-xl border border-white/50 bg-black px-5 text-white transition-all duration-300 hover:-translate-y-1 hover:border-white hover:shadow-[0_0_24px_rgba(255,255,255,0.22)] sm:w-56'>
                                <FaApple className='text-4xl' />
                                <div className='text-left leading-none'>
                                    <p className='text-xs font-semibold'>Download on the</p>
                                    <h3 className='text-2xl font-bold'>App Store</h3>
                                </div>
                            </div>

                            <div className='flex h-15 w-full items-center justify-center gap-3 rounded-xl border border-white/50 bg-black px-5 text-white transition-all duration-300 hover:-translate-y-1 hover:border-white hover:shadow-[0_0_24px_rgba(255,255,255,0.22)] sm:w-56'>
                                <FaGooglePlay className='text-3xl text-green-400' />
                                <div className='text-left leading-none'>
                                    <p className='text-xs font-semibold'>GET IT ON</p>
                                    <h3 className='text-2xl font-bold'>Google Play</h3>
                                </div>
                            </div>
                        </div>

                        <div className='mt-8 flex w-full items-center justify-center'>
                            <img src={Logo} alt="MFILM" className='w-105 max-w-full object-contain opacity-95 transition-all duration-300 hover:scale-105 hover:opacity-100' />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default FooterClient;
