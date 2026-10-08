export default function PaymentMethods() {
    return <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="h-20 bg-slate-800/80 border-2 border-yellow-400 rounded-2xl flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-blue-400 font-black">PayPal</p>
            <p className="text-xs text-yellow-300">Đang hỗ trợ</p>
        </div>
        {['Thẻ trực tiếp', 'Ví MoMo', 'Ví ZaloPay', 'Ví ShopeePay', 'VNPAY'].map(method => (
            <div key={method} aria-disabled="true" className="h-20 bg-slate-800/50 border-2 border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400">
                <p className="text-xs font-medium">{method}</p>
                <p className="text-[11px]">Chưa hỗ trợ</p>
            </div>
        ))}
    </div>;
}
