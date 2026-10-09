import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function NotFound() {
    return <section className="mx-auto min-h-[65vh] max-w-6xl px-6 pb-20 pt-40 text-center text-white">
        <SEO title="Không tìm thấy trang" description="Đường dẫn không tồn tại. Khám phá phim mới và tìm phim tại MFILM." noindex />
        <h1 className="mb-4 text-3xl font-bold">Không tìm thấy trang</h1>
        <p className="mb-8 text-slate-400">Đường dẫn có thể đã thay đổi hoặc nội dung không còn tồn tại.</p>
        <Link to="/" className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black">Về trang chủ</Link>
    </section>;
}
