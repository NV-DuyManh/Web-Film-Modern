import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { initialOptions } from '../../../utils/Constants';
import { updateDocument, addDocument } from '../../../services/firebaseService';
import Swal from 'sweetalert2';

function DepositModal({ isOpen, onClose, isLogin }) {
    if (!isOpen) return null;

    const packages = [
        { id: 1, name: 'Gói Khởi Động', priceUSD: 2.00, rAmount: 40, bonus: 0, tag: '' },
        { id: 2, name: 'Gói Tiêu Chuẩn', priceUSD: 5.00, rAmount: 100, bonus: 10, tag: 'Phổ biến nhất' },
        { id: 3, name: 'Gói Cao Cấp', priceUSD: 10.00, rAmount: 200, bonus: 50, tag: 'Tiết kiệm 20%' }
    ];

    const [selectedPackage, setSelectedPackage] = useState(packages[1]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSuccess = async (transactionId) => {
        setIsProcessing(true);
        try {
            const totalR = selectedPackage.rAmount + selectedPackage.bonus;
            const currentRBalance = Number(isLogin?.rBalance) || 0;
            const newRBalance = currentRBalance + totalR;

            // Cập nhật số dư User
            await updateDocument("Users", {
                id: isLogin.id,
                rBalance: newRBalance
            });

            // Lưu lịch sử nạp
            await addDocument("Deposits", {
                userID: isLogin.id,
                transactionID: transactionId,
                amountR: totalR,
                priceUSD: selectedPackage.priceUSD,
                paymentMethod: "PayPal",
                date: new Date(),
                status: "Success"
            });

            Swal.fire({
                title: 'Nạp thành công!',
                text: `Bạn đã nạp thành công ${totalR} R vào ví.`,
                icon: 'success',
                background: '#0f1322',
                color: '#fff',
                timer: 2000,
                showConfirmButton: false
            });

            onClose();
            // Xử lý reload để update context ngay lập tức, hoặc context tự cập nhật nếu realtime
        } catch (error) {
            console.error("Lỗi khi lưu giao dịch nạp tiền:", error);
            Swal.fire({
                title: 'Lỗi!',
                text: 'Đã có lỗi xảy ra trong quá trình nạp tiền.',
                icon: 'error',
                background: '#0f1322',
                color: '#fff'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-md bg-[#0f1322] border border-white/10 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-linear-to-r from-blue-900/30 to-transparent">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <span className="text-yellow-400">💎</span> Nạp Ví MFILM
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition">
                        <IoClose size={24} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    <div className="mb-6 space-y-3">
                        {packages.map(pkg => {
                            const isSelected = selectedPackage.id === pkg.id;
                            const totalR = pkg.rAmount + pkg.bonus;
                            return (
                                <div 
                                    key={pkg.id} 
                                    onClick={() => setSelectedPackage(pkg)}
                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between ${
                                        isSelected 
                                        ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.2)]' 
                                        : 'border-white/10 bg-slate-800/40 hover:border-white/20'
                                    }`}
                                >
                                    {pkg.tag && (
                                        <div className="absolute -top-3 left-4 bg-linear-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                                            {pkg.tag}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-yellow-400' : 'border-slate-500'}`}>
                                            {isSelected && <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-base">{pkg.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <p className="text-yellow-400 font-black text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">{totalR} R</p>
                                                {pkg.bonus > 0 && <span className="text-green-400 text-xs font-semibold">(+{pkg.bonus} Thưởng)</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-lg ${isSelected ? 'text-white' : 'text-slate-300'}`}>${pkg.priceUSD.toFixed(2)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-300">Gói chọn:</span>
                            <span className="text-white font-bold">{selectedPackage.name}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-300">Số R nhận được:</span>
                            <span className="text-yellow-400 font-bold">{selectedPackage.rAmount + selectedPackage.bonus} R</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-700/50 pt-2 mt-2">
                            <span className="text-white font-bold">Tổng thanh toán:</span>
                            <span className="text-cyan-400 font-black text-lg">${selectedPackage.priceUSD.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="relative min-h-[150px]">
                        {isProcessing ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0f1322]">
                                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-3 text-cyan-400 font-medium text-sm">Đang xử lý thanh toán...</p>
                            </div>
                        ) : (
                            <PayPalScriptProvider options={initialOptions}>
                                <PayPalButtons
                                    style={{ layout: "vertical", height: 45 }}
                                    createOrder={(data, actions) => {
                                        return actions.order.create({
                                            purchase_units: [{
                                                amount: { value: selectedPackage.priceUSD.toString() }
                                            }]
                                        });
                                    }}
                                    onApprove={(data, actions) => {
                                        return actions.order.capture().then((details) => {
                                            handleSuccess(details.id);
                                        });
                                    }}
                                    onError={(err) => {
                                        console.error("PayPal Error:", err);
                                    }}
                                />
                            </PayPalScriptProvider>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DepositModal;
