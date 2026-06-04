
import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

import './SlideBanner.css';

// import required modules
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';

export default function SlideBanner() {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);

    return (
        <div className='slide-banner relative'>
            <Swiper
                style={{
                    '--swiper-navigation-color': '#fff',
                    '--swiper-pagination-color': '#fff',
                }}
                spaceBetween={10}
                navigation={true}
                thumbs={{ swiper: thumbsSwiper }}
                modules={[FreeMode, Navigation, Thumbs]}
                className="mySwiper2"
            >
                <SwiperSlide>
                    <img src="https://swiperjs.com/demos/images/abstract-1.jpg" />
                    <div className='absolute bg-amber-300 left-10'>
                        <h1 className='text-left'>Địa Ngục Độc Thân</h1>
                        <h2 className='text-left'>Single in</h2>
                        <div className='flex gap-2'>
                            <button className='border py-1 px-2 rounded-md'> ferfer</button>
                            <button className='border py-1 px-2 rounded-md'> ferfer</button>
                            <button className='border py-1 px-2 rounded-md'> ferfer</button>
                            <button className='border py-1 px-2 rounded-md'> ferfer</button>
                        </div>
                        <h5 className='bg-gray-400 p-1 w-30 mt-2 '>Hài Hước</h5>
                        <p className='w-200 text-left text-wrap'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque dolorem mollitia sunt blanditiis ea a aliquid optio neque corporis quo.</p>


                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <img src="https://swiperjs.com/demos/images/abstract-2.jpg" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src="https://swiperjs.com/demos/images/abstract-3.jpg" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src="https://swiperjs.com/demos/images/abstract-4.jpg" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src="https://swiperjs.com/demos/images/abstract-5.jpg" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src="https://swiperjs.com/demos/images/abstract-6.jpg" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src="https://swiperjs.com/demos/images/abstract-7.jpg" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src="https://swiperjs.com/demos/images/abstract-8.jpg" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src="https://swiperjs.com/demos/images/abstract-9.jpg" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src="https://swiperjs.com/demos/images/abstract-10.jpg" />
                </SwiperSlide>
            </Swiper>
            <div className='absolute z-1 w-100 right-10 bottom-10'>
                <Swiper
                    onSwiper={setThumbsSwiper}
                    spaceBetween={10}
                    slidesPerView={4}
                    freeMode={true}
                    watchSlidesProgress={true}
                    modules={[FreeMode, Navigation, Thumbs]}
                    className="mySwiper"
                >
                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-1.jpg" />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-2.jpg" />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-3.jpg" />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-4.jpg" />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-5.jpg" />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-6.jpg" />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-7.jpg" />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-8.jpg" />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-9.jpg" />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-10.jpg" />
                    </SwiperSlide>
                </Swiper>
            </div>

        </div>
    );
}