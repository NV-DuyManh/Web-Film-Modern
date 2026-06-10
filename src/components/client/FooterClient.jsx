import React from 'react';
import { FaFacebookF, FaLinkedinIn, FaStar } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

function FooterClient() {
    return (
        <footer className='bg-[#070a14] px-8 py-12 text-white md:px-14 lg:px-20'>
            <div className='max-w-200'>
                <div className='mb-8 inline-flex items-center gap-2 rounded-full bg-red-900/90 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(127,29,29,0.35)] transition-all duration-300 hover:bg-red-800'>
                    <span className='flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-yellow-300'>
                        <FaStar className='text-sm' />
                    </span>
                    Hoàng Sa & Trường Sa là của Việt Nam!
                </div>

                <div className='flex flex-col gap-8 md:flex-row md:items-center'>
                    <div className='flex items-center gap-4'>
                        <img
                            src="https://rophim10.app/images/logo.svg" className='h-18 w-auto object-contain'
                        />
                    </div>

                    <div className=' h-12 w-1px bg-white/10 md:block'></div>

                    <div className='flex items-center gap-4'>
                        <button className='flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-lg text-white/80 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-black hover:shadow-[0_0_18px_rgba(255,255,255,0.25)]'>
                            <FaXTwitter />
                        </button>

                        <button className='flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-lg text-white/80 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_18px_rgba(37,99,235,0.35)]'>
                            <FaFacebookF />
                        </button>

                        <button className='flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-lg text-white/80 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:text-white hover:shadow-[0_0_18px_rgba(29,78,216,0.35)]'>
                            <FaLinkedinIn />
                        </button>
                    </div>
                </div>

                <div className='mt-10 flex flex-wrap gap-x-10 gap-y-4 text-base font-medium text-white'>
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

                <div className='mt-12 max-w-195 text-[15px] leading-7 text-gray-300'>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta incidunt est numquam fuga nihil. Eum porro expedita eaque ullam illum quas vel aspernatur fuga, perspiciatis, totam quos nam. Sequi veritatis impedit sint dolores, ipsam, voluptatibus porro laboriosam ipsum, eius culpa minima aspernatur necessitatibus? Fuga repudiandae iure, laborum molestiae voluptatem provident.
                    </p>

                    <p className='mt-4 text-gray-400'>
                        2025 Rổ Phim. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default FooterClient;