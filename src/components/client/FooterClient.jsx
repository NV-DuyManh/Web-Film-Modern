import React from 'react';
import { FaApple, FaFacebookF, FaGooglePlay, FaLinkedinIn, FaStar } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import Logo from '../../assets/Logo.png';
import Logo2 from '../../assets/Logo2.png';

function FooterClient() {
    return (
        <footer className='bg-black px-8 py-12 text-white md:px-14 lg:px-20'>
            <div className='flex max-w-full items-start justify-between gap-10'>
                <div className='max-w-200'>
                    <div className='mb-8 inline-flex items-center gap-2 rounded-full bg-red-900 px-4 py-2 text-sm font-semibold text-white'>
                        <span className='flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-yellow-300'>
                            <FaStar className='text-sm' />
                        </span>
                        Hoàng Sa & Trường Sa là của Việt Nam!
                    </div>

                    <div className='flex flex-col gap-8 md:flex-row md:items-center'>
                        <div className='flex items-center gap-4'>
                            <img src={Logo2} className='h-18 w-auto object-contain' />
                        </div>

                        <div className='ml-10 flex items-center gap-4'>
                            <a href="" target="_blank" className='flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-lg text-white/80 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-black hover:shadow-[0_0_18px_rgba(255,255,255,0.25)]'><FaXTwitter /></a>

                            <a href="https://www.facebook.com/duymanhdev" target="_blank" className='flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-lg text-white/80 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_18px_rgba(37,99,235,0.35)]'><FaFacebookF /></a>

                            <a href="https://www.linkedin.com/in/duymanhdev/" target="_blank" className='flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-lg text-white/80 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:text-white hover:shadow-[0_0_18px_rgba(29,78,216,0.35)]'><FaLinkedinIn /></a>
                        </div>
                    </div>

                    <div className='mt-8 flex flex-wrap gap-x-10 gap-y-4 text-base font-medium text-white'>
                        <a href="" className='transition-all duration-300 hover:text-yellow-300'>
                            Hỏi Đáp
                        </a>

                        <a href="" className='transition-all duration-300 hover:text-yellow-300'>
                            Chính sách bảo mật
                        </a>

                        <a href="" className='transition-all duration-300 hover:text-yellow-300'>
                            Điều khoản sử dụng
                        </a>

                        <a href="" className='transition-all duration-300 hover:text-yellow-300'>
                            Giới thiệu
                        </a>
                    </div>

                    <div className='mt-5 max-w-195 text-[15px] leading-7 text-gray-300'>
                        <p>
                            MFILM - Trang xem phim online miễn phí chất lượng cao Vietsub, thuyết minh, lồng tiếng Full HD – 4K. Kho phim mới khổng lồ gồm phim chiếu rạp, phim bộ, phim lẻ từ Việt Nam, Hàn Quốc, Trung Quốc, Thái Lan, Nhật Bản, Âu Mỹ… đa dạng thể loại.
                            <br />
                            Dịp Tết Việt Nam, RoPhim trở lại với loạt phim xuân hấp dẫn, hài Tết và siêu phẩm mới nhất, mang đến trải nghiệm giải trí trọn vẹn bên gia đình.
                        </p>

                        <p className='mt-4 text-gray-400'>
                            2026 MFILM
                        </p>
                    </div>
                </div>

                <div className='hidden flex-1 flex-col items-center lg:flex'>
                    <div className='mb-8 max-w-150 text-center'>
                        <h2 className='text-2xl font-bold uppercase leading-snug tracking-wide text-gray-300'>
                            Tải ứng dụng MFILM trên thiết bị di động để trải nghiệm mượt mà hơn
                        </h2>

                        <div className='mt-5 flex items-center justify-center gap-4'>
                            <a href="" className='flex h-16 min-w-56 items-center gap-3 rounded-xl border border-white/60 bg-black px-5 text-white transition-all duration-300 hover:-translate-y-1 hover:border-white hover:shadow-[0_0_22px_rgba(255,255,255,0.22)]'>
                                <FaApple className='text-4xl' />
                                <div className='text-left leading-none'>
                                    <p className='text-xs font-semibold'>Download on the</p>
                                    <h3 className='text-2xl font-bold'>App Store</h3>
                                </div>
                            </a>

                            <a href="" className='flex h-16 w-56 items-center gap-3 rounded-xl border border-white/60 bg-black px-5 text-white transition-all duration-300 hover:-translate-y-1 hover:border-white hover:shadow-[0_0_22px_rgba(255,255,255,0.22)]'>
                                <FaGooglePlay className='text-3xl text-green-400' />
                                <div className='text-left leading-none'>
                                    <p className='text-xs font-semibold'>GET IT ON</p>
                                    <h3 className='text-2xl font-bold'>Google Play</h3>
                                </div>
                            </a>
                        </div>
                    </div>
                    <div className='flex w-full justify-center items-center'>
                        <img src={Logo} alt="MFILM" className='w-110 object-contain' />
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default FooterClient;