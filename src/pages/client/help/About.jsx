import { Link } from 'react-router-dom';
import SEO from '../../../components/SEO';

export function AboutContent() {
    return <>
        <p className="mt-4 leading-7 text-slate-300">MFILM giúp bạn tìm phim theo thể loại, quốc gia, diễn viên và chủ đề; lưu danh sách yêu thích và xem tiếp các phim đang theo dõi. Chất lượng hình ảnh, phụ đề và bản thuyết minh tùy thuộc từng phim và nguồn phát.</p>
        <Link to="/film-new" className="mt-4 inline-block font-semibold text-yellow-400 hover:underline">Khám phá phim mới →</Link>
    </>;
}

export default function About() {
    return (
        <div className="mx-auto min-h-[60vh] max-w-6xl px-4 pb-16 pt-32 sm:px-6 lg:pt-40">
            <SEO title="Giới thiệu MFILM" url="/gioi-thieu" description="Khám phá MFILM: tìm phim, lưu danh sách yêu thích và xem tiếp các phim đang theo dõi." />
            <section className="rounded-3xl border border-yellow-500/35 bg-[#131a24] p-6 sm:p-10">
                <p className="mb-3 text-sm font-bold uppercase tracking-widest text-yellow-400">MFILM</p>
                <h1 className="text-2xl font-bold text-white sm:text-4xl">Giới thiệu MFILM</h1>
                <AboutContent />
                <Link to="/ho-tro" className="mt-6 inline-block rounded-xl border border-slate-600 px-5 py-3 font-semibold text-white hover:border-yellow-400 hover:text-yellow-400">Hỗ trợ & hỏi đáp</Link>
            </section>
        </div>
    );
}
