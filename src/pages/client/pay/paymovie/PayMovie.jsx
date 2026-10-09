import useMovie from '../../../../hooks/useMovie';
import { useMovies } from '../../../../hooks/useCollections';
import MovieImage from '../../../../components/MovieImage';
import PaymentMethods from '../PaymentMethods';
import useCanonicalPath from '../../../../hooks/useCanonicalPath';
import { routeSegment, findRouteEntity } from '../../../../utils/nameRoutes';
import React, { useContext, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { updateDocument, addDocument } from '../../../../services/firebaseService';
import PageLoadingSpinner from '../../../../components/common/PageLoadingSpinner';
import { rentalExpiry, RENTAL_NOTICE, validRentalPrice } from '../../../../utils/rentalPolicy';
import useCatalogStatus from '../../../../hooks/useCatalogStatus';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { initialOptions } from '../../../../utils/Constants';
import Swal from 'sweetalert2';
import ModalPayMovie from './ModalPayMovie';

function PayMovie() {
    const navigate = useNavigate();
    const { isLogin } = useContext(AuthContext);
    const { slug: routeValue } = useParams();
    const catalogStatus = useCatalogStatus('Movies');
    const movies = useMovies();
    const [showModal, setShowModal] = useState(false);

    const currentMovie = useMovie(routeValue);
    const movie = useMemo(() => currentMovie, [currentMovie]);
    useCanonicalPath(movie ? `/payMovie/${routeSegment(movie)}` : '');

    const rentPrice = Number(movie?.rent) || 0;
    const formattedPrice = validRentalPrice(rentPrice) ? `${rentPrice.toLocaleString('vi-VN')}đ` : 'Chưa có giá thuê';

    const createRent = async (transactionId) => {
        try {
            if (!movie?.id || !isLogin?.id || !validRentalPrice(movie.rent)) throw new Error('Thông tin thuê phim chưa sẵn sàng.');
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
                    
                    newExpireDate = rentalExpiry(currentExpireDate, now);
                    
                    updatedRents = [...isLogin.rentedMovies];
                    updatedRents[existingRentIndex] = {
                        movieID: movie.id,
                        transactionId: transactionId,
                        rentDate: new Date().toISOString(),
                        expireDate: newExpireDate,
                    };
                } else {
                    newExpireDate = rentalExpiry(null, now);
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
                newExpireDate = rentalExpiry(null, now);
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

    if (!movie && (findRouteEntity(movies, routeValue) || (movies.length === 0 && catalogStatus.status !== 'ready' && catalogStatus.status !== 'error'))) return <div className="bg-[#0f1322] pt-28"><PageLoadingSpinner text="Đang tải thông tin thuê phim..." /></div>;
    if (!movie) return <div className="min-h-[60vh] bg-[#0f1322] pt-28 px-4 text-center text-white"><h1 className="text-xl font-bold">Không tìm thấy phim</h1><button className="mt-4 text-yellow-400" onClick={() => navigate('/')}>Về trang chủ</button></div>;

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
                                    <MovieImage movie={movie} kind="poster" imageWidth={300} imageHeight={450} imageType="poster" alt={movie.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                                    <p className="text-rose-400 font-black inline">{movie?.otherName || movie?.name}</p>
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
                                    <p className="text-white font-bold inline">{formattedPrice}</p>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <p className="text-slate-300 font-medium inline">Thời hạn thuê:</p>
                                    <p className="text-white font-bold inline">30 ngày</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 pt-6 flex justify-between items-center mb-6">
                            <p className="text-white font-black text-lg uppercase tracking-wide inline">Tổng cộng</p>
                            <p className="text-rose-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(244,63,94,0.3)] inline">{formattedPrice}</p>
                        </div>

                        <p className="text-slate-400 text-xs mb-6">
                            * {RENTAL_NOTICE}
                        </p>

                        <p className="text-slate-400 text-xs">Mã ưu đãi: chưa hỗ trợ.</p>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-xl font-black text-white mb-6 tracking-wide flex items-center gap-2 uppercase">
                            <p className="w-2 h-6 bg-yellow-400 rounded-full inline"></p>
                            Chọn phương thức
                        </h2>

                        <PaymentMethods />
                        {!isLogin?.id && <button onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))} className="mb-4 text-yellow-400 font-bold">Đăng nhập để thuê phim</button>}
                        {!validRentalPrice(rentPrice) && <p role="status" className="mb-4 text-yellow-400">Phim chưa có giá thuê hợp lệ. Vui lòng chọn phim khác.</p>}

                        <div className="space-y-4">
                            <PayPalScriptProvider options={initialOptions}>
                                <PayPalButtons
                                    disabled={!isLogin?.id || !validRentalPrice(rentPrice)}
                                    style={{ layout: "vertical" }}
                                    createOrder={(data, actions) => {
                                        if (!isLogin?.id || !validRentalPrice(rentPrice)) throw new Error('Vui lòng đăng nhập và kiểm tra giá thuê.');
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
                                            return createRent(transactionId);
                                        });
                                    }}
                                    onError={(err) => {
                                        console.error("PayPal error:", err);
                                        Swal.fire({ title: 'Chưa thanh toán được', text: 'Vui lòng kiểm tra kết nối rồi thử lại qua PayPal.', icon: 'error', background: '#0f1322', color: '#fff' });
                                    }}
                                />
                            </PayPalScriptProvider>

                            <div className="text-center pt-2">
                                <p className="text-slate-400 text-xs italic inline">Thanh toán an toàn được hỗ trợ bởi </p>
                                <p className="text-blue-400 text-sm font-bold italic inline">PayPal</p>
                            </div>


                        </div>
                    </div>

                </div>
            </div>
            <ModalPayMovie 
                show={showModal} 
                movieName={movie?.otherName || movie?.name} 
                onClose={() => {
                    setShowModal(false);
                    window.scrollTo(0, 0);
                    navigate(`/xem-phim/${routeSegment(movie)}`);
                }} 
                onGoHome={() => {
                    setShowModal(false);
                    window.scrollTo(0, 0);
                    navigate(`/phim/${routeSegment(movie)}`);
                }}
            />
        </div>
    );
}

export default PayMovie;
