import { getOptimizedUrl } from '../../../../utils/cloudinary';
import React, { useContext, useMemo, useState } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { updateDocument, addDocument } from '../../../../services/firebaseService';
import { FaCreditCard } from 'react-icons/fa';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { initialOptions } from '../../../../utils/Constants';
import Swal from 'sweetalert2';
import ModalPayMovie from './ModalPayMovie';

function PayMovie(props) {
    const navigate = useNavigate();
    const { isLogin } = useContext(AuthContext);
    const { id } = useParams();
    const movies = useMovies() || [];
    const [showModal, setShowModal] = useState(false);

    const movie = useMemo(() => getObjectById(movies, id), [movies, id]);

    const rentPrice = Number(movie?.rent) || 0;
    const formattedPrice = rentPrice.toLocaleString('vi-VN');

    const createRent = async (transactionId) => {
        try {
            const rentDuration = 48 * 60 * 60 * 1000;
            const now = Date.now();
            let newExpireDate;
            let updatedRents = [];

            if (isLogin?.rentedMovies) {
                const existingRentIndex = isLogin.rentedMovies.findIndex(rent => 
                    (typeof rent === 'object' && rent.movieID === movie.id) || 
                    rent === movie.id
                );

                if (existingRentIndex !== -1) {
                    const existingRent = isLogin.rentedMovies[existingRentIndex];
                    let currentExpireDate = now;
                    
                    if (typeof existingRent === 'object' && existingRent.expireDate) {
                        const oldExpire = new Date(existingRent.expireDate).getTime();
                        if (oldExpire > now) {
                            currentExpireDate = oldExpire;
                        }
                    }
                    
                    newExpireDate = new Date(currentExpireDate + rentDuration).toISOString();
                    
                    updatedRents = [...isLogin.rentedMovies];
                    updatedRents[existingRentIndex] = {
                        movieID: movie.id,
                        transactionId: transactionId,
                        rentDate: new Date().toISOString(),
                        expireDate: newExpireDate,
                    };
                } else {
                    newExpireDate = new Date(now + rentDuration).toISOString();
                    updatedRents = [
                        ...isLogin.rentedMovies, 
                        {
                            movieID: movie.id,
                            transactionId: transactionId,
                            rentDate: new Date().toISOString(),
                            expireDate: newExpireDate,
                        }
                    ];
                }
            } else {
                newExpireDate = new Date(now + rentDuration).toISOString();
                updatedRents = [{
                    movieID: movie.id,
                    transactionId: transactionId,
                    rentDate: new Date().toISOString(),
                    expireDate: newExpireDate,
                }];
            }

            await updateDocument("Users", {
                id: isLogin.id,
                rentedMovies: updatedRents
            });
            
            await addDocument("RentMovies", {
                transactionID: transactionId,
                userID: isLogin?.id,
                movieID: movie.id,
                paymentMethod: "PayPal",
                price: (rentPrice/26000).toFixed(2),
                startDate: new Date(),
                expiryDate: new Date(newExpireDate),
                status: "Success"
            });

            setShowModal(true);
        } catch (error) {
            console.error("Lỗi khi lưu giao dịch:", error);
            Swal.fire({
                title: 'Lỗi!',
                text: 'Đã có lỗi xảy ra trong quá trình lưu thông tin thanh toán.',
                icon: 'error',
                background: '#0f1322',
                color: '#fff'
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1322] pt-28 pb-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        Thanh toán phim lẻ
                    </h1>
                    <p className="text-slate-300 text-sm">Thưởng thức siêu phẩm điện ảnh ngay tại nhà</p>
                    <div className="w-16 h-1 bg-linear-to-r from-rose-500 to-pink-500 mx-auto mt-3 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

                    <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-xl font-black text-white mb-8 tracking-wide flex items-center gap-2 uppercase">
                            <p className="w-2 h-6 bg-rose-500 rounded-full inline"></p>
                            Thông tin thanh toán
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-6 mb-8">
                            <div className="w-full sm:w-1/3 aspect-3/4 sm:aspect-3/4 rounded-xl overflow-hidden shrink-0 border-2 border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative group">
                                {movie?.imgUrl ? (
                                    <img src={getOptimizedUrl(movie.imgUrl, 300, 450, 'poster')} alt={movie.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-linear-to-br from-rose-900 to-slate-900 group-hover:scale-105 transition-transform duration-500"></div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40">
                                            <div className="font-black text-white text-xl uppercase text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">
                                                {movie?.name}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <p className="text-slate-300 font-medium inline">Tài khoản:</p>
                                    <p className="text-white font-bold inline">{isLogin?.fullName || isLogin?.email}</p>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <p className="text-slate-300 font-medium inline">Phim:</p>
                                    <p className="text-rose-400 font-black inline">{movie?.name}</p>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <p className="text-slate-300 font-medium inline">Thời lượng:</p>
                                    <p className="text-white font-bold inline">{movie?.duration ? `${movie.duration} phút` : 'Đang cập nhật'}</p>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <p className="text-slate-300 font-medium inline">Số tập:</p>
                                    <p className="text-white font-bold inline">{movie?.endEpisode || 0} tập</p>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <p className="text-slate-300 font-medium inline">Đơn giá:</p>
                                    <p className="text-white font-bold inline">{formattedPrice}đ</p>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <p className="text-slate-300 font-medium inline">Thời hạn thuê:</p>
                                    <p className="text-white font-bold inline">48 giờ</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 pt-6 flex justify-between items-center mb-6">
                            <p className="text-white font-black text-lg uppercase tracking-wide inline">Tổng cộng</p>
                            <p className="text-rose-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(244,63,94,0.3)] inline">{formattedPrice}đ</p>
                        </div>

                        <p className="text-slate-400 text-xs mb-6">
                            * Lưu ý: Thời gian thuê phim là 30 ngày sau khi thuê và còn 48 giờ khi bắt đầu xem phim.
                        </p>

                        <button className="text-rose-400 text-sm hover:underline font-bold">Áp dụng mã ưu đãi</button>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-xl font-black text-white mb-6 tracking-wide flex items-center gap-2 uppercase">
                            <p className="w-2 h-6 bg-yellow-400 rounded-full inline"></p>
                            Chọn phương thức
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-yellow-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition hover:shadow-[0_0_15px_rgba(250,204,21,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Thẻ tín dụng</p>
                                <div className="flex gap-1">
                                    <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] text-blue-800 font-black italic">VISA</div>
                                    <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] text-red-600 font-black italic">MC</div>
                                </div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-pink-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition hover:shadow-[0_0_15px_rgba(244,114,182,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Ví MoMo</p>
                                <div className="text-pink-400 font-black tracking-wide bg-white/10 px-2 py-0.5 rounded">MoMo</div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-blue-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition hover:shadow-[0_0_15px_rgba(96,165,250,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Ví ZaloPay</p>
                                <div className="text-blue-400 font-black text-sm tracking-wide">Zalo<p className="text-green-400 inline">Pay</p></div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-orange-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition hover:shadow-[0_0_15px_rgba(251,146,60,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Ví ShopeePay</p>
                                <div className="w-6 h-6 bg-orange-500 rounded text-white flex items-center justify-center text-xs font-black shadow-md">S</div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-red-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition hover:shadow-[0_0_15px_rgba(248,113,113,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">VNPAY</p>
                                <div className="text-red-500 font-black text-sm tracking-widest">VN<p className="text-blue-500 inline">PAY</p></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <PayPalScriptProvider options={initialOptions}>
                                <PayPalButtons
                                    style={{ layout: "vertical" }}
                                    createOrder={(data, actions) => {
                                        return actions.order.create({
                                            purchase_units: [{
                                                amount: {
                                                    value: (rentPrice / 26000).toFixed(2)
                                                }
                                            }]
                                        });
                                    }}
                                    onApprove={(data, actions) => {
                                        return actions.order.capture().then((details) => {
                                            const transactionId = details.id;
                                            createRent(transactionId);
                                        });
                                    }}
                                    onError={(err) => {
                                        console.error("PayPal error:", err);
                                    }}
                                />
                            </PayPalScriptProvider>

                            <button className="w-full h-14 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex items-center justify-center gap-3 transition-colors">
                                <FaCreditCard className="text-white text-xl" />
                                <p className="text-white font-bold inline">Thẻ ghi nợ hoặc tín dụng</p>
                            </button>

                            <div className="text-center pt-2">
                                <p className="text-slate-400 text-xs italic inline">Thanh toán an toàn được hỗ trợ bởi </p>
                                <p className="text-blue-400 text-sm font-bold italic inline">PayPal</p>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-700/50">
                                <button className="w-full h-14 bg-linear-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 rounded-xl flex items-center justify-center transition shadow-[0_4px_15px_rgba(225,29,72,0.4)] hover:-translate-y-1">
                                    <p className="text-white font-black text-lg tracking-wide inline">THANH TOÁN NGAY</p>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <ModalPayMovie 
                show={showModal} 
                movieName={movie?.name} 
                onClose={() => {
                    setShowModal(false);
                    window.scrollTo(0, 0);
                    navigate(`/xem-phim/${movie.slug || movie.id}`);
                }} 
                onGoHome={() => {
                    setShowModal(false);
                    window.scrollTo(0, 0);
                    navigate(`/phim/${movie.slug || movie.id}`);
                }}
            />
        </div>
    );
}

export default PayMovie;
