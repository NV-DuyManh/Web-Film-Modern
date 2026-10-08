import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronDown, FaQuestionCircle, FaMobileAlt } from 'react-icons/fa';
import { SiZalo } from 'react-icons/si';
import SEO from '../../../components/SEO';

const questions = [
    ['Phim không phát hoặc tải chậm thì làm gì?', 'Thử đổi giữa Server 1 và Server 2 trong trang xem phim, chọn lại tập và kiểm tra kết nối mạng. Nếu vẫn lỗi, gửi tên phim, tập và server đang dùng cho MFILM qua Zalo.'],
    ['Làm sao tìm tập trong một bộ phim dài?', 'Danh sách chia thành các nhóm tối đa 120 tập. Mở bộ chọn nhóm, nhập số tập cần tìm rồi chọn nhóm phù hợp. Nút mũi tên cho phép chuyển sang nhóm trước hoặc sau.'],
    ['Làm sao xem tiếp ở vị trí đã dừng?', 'Tiến độ được lưu trên trình duyệt đang dùng. Đăng nhập cùng tài khoản để đồng bộ giữa các thiết bị khi có kết nối mạng. Dừng phát trước khi chuyển sang thiết bị khác để gửi tiến độ mới nhất.'],
    ['Thuê phim được xem trong bao lâu?', 'Thời hạn thuê là 30 ngày kể từ khi thanh toán thành công. Bạn có thể kiểm tra các phim đã thuê và ngày hết hạn ở mục Phim Đang Thuê trong tài khoản.'],
    ['Vì sao một số phim yêu cầu gói thành viên?', 'Quyền xem phụ thuộc gói của từng phim hoặc giao dịch thuê còn hạn. Xem thông tin phim và trang Gói thành viên để chọn quyền truy cập phù hợp.'],
];

export default function Help() {
    const { hash } = useLocation();
    useEffect(() => {
        if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
        else window.scrollTo(0, 0);
    }, [hash]);
    return (
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:px-6 lg:pt-40">
            <SEO title="Hỗ trợ & hỏi đáp" url="/ho-tro" description="Hướng dẫn xem phim, chọn tập, xem tiếp, thuê phim và sử dụng MFILM trên điện thoại." />
            <section className="rounded-3xl border border-yellow-500/35 bg-[#131a24] p-6 sm:p-10">
                <p className="mb-3 text-sm font-bold uppercase tracking-widest text-yellow-400">MFILM</p>
                <h1 className="flex items-center gap-3 text-2xl font-bold text-white sm:text-4xl"><FaQuestionCircle className="shrink-0 text-yellow-400" /> Hỗ trợ & hỏi đáp</h1>
                <p className="mt-4 leading-7 text-slate-300">Tìm hướng dẫn nhanh hoặc liên hệ khi bạn cần hỗ trợ xem phim.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <a href="https://zalo.me/0779534325" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300"><SiZalo className="text-2xl" /> Liên hệ MFILM</a>
                    <Link to="/upgrade-vip" className="rounded-xl border border-slate-600 px-5 py-3 font-semibold text-white hover:border-yellow-400 hover:text-yellow-400">Gói thành viên</Link>
                </div>
            </section>
            <section className="mt-8 space-y-3" aria-label="Câu hỏi thường gặp">
                {questions.map(([question, answer]) => (
                    <details key={question} className="group rounded-2xl border border-slate-700 bg-[#131a24] text-white open:border-yellow-500/50">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold [&::-webkit-details-marker]:hidden">{question}<FaChevronDown className="shrink-0 text-yellow-400 transition-transform group-open:rotate-180" /></summary>
                        <p className="px-5 pb-5 leading-7 text-slate-300">{answer}</p>
                    </details>
                ))}
            </section>
            <section id="thiet-bi" className="mt-8 scroll-mt-32 rounded-2xl border border-cyan-500/30 bg-[#131a24] p-6 sm:p-8">
                <h2 className="flex items-center gap-3 text-xl font-bold text-white"><FaMobileAlt className="text-cyan-400" /> MFILM trên điện thoại</h2>
                <p className="mt-4 leading-7 text-slate-300">Mở mfilm.online trong trình duyệt điện thoại để xem phim. Bạn có thể thêm MFILM vào màn hình chính để truy cập nhanh:</p>
                <ul className="mt-4 space-y-3 pl-5 text-slate-300 list-disc">
                    <li><strong className="text-white">iPhone / iPad:</strong> mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính.</li>
                    <li><strong className="text-white">Android:</strong> mở bằng Chrome → menu ⋮ → Thêm vào màn hình chính hoặc Cài đặt ứng dụng, nếu trình duyệt hiển thị lựa chọn này.</li>
                </ul>
            </section>
            <section id="gioi-thieu" className="mt-8 scroll-mt-32 rounded-2xl border border-slate-700 bg-[#131a24] p-6 sm:p-8">
                <h2 className="text-xl font-bold text-white">Giới thiệu MFILM</h2>
                <p className="mt-4 leading-7 text-slate-300">MFILM giúp bạn tìm phim theo thể loại, quốc gia, diễn viên và chủ đề; lưu danh sách yêu thích và xem tiếp các phim đang theo dõi. Chất lượng hình ảnh, phụ đề và bản thuyết minh tùy thuộc từng phim và nguồn phát.</p>
                <Link to="/film-new" className="mt-4 inline-block font-semibold text-yellow-400 hover:underline">Khám phá phim mới →</Link>
            </section>
        </div>
    );
}
