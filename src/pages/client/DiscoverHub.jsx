import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CategoryContext } from '../../contexts/CategoryProvider';
import { useMovies } from '../../hooks/useCollections';
import SEO from '../../components/SEO';

export default function DiscoverHub({ type }) {
    const categories = useContext(CategoryContext) || [];
    const movies = useMovies() || [];
    const country = type === 'country';
    const names = country
        ? [...new Set(movies.map(movie => movie.countriesID).filter(Boolean))]
        : categories.filter(category => movies.some(movie => movie.listCategory?.includes(category.id))).map(category => category.name);
    const title = country ? 'Phim theo quốc gia' : 'Thể loại phim';
    return <main className="mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:pt-40">
        <SEO url={`/${type}`} schema={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: `https://www.mfilm.online/${type}` }} />
        <h1 className="mb-4 text-3xl font-bold text-white">{title}</h1>
        <p className="mb-8 leading-7 text-slate-300">Chọn {country ? 'quốc gia' : 'thể loại'} để khám phá các phim đang có trong kho MFILM.</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {names.map(name => <Link key={name} to={`/${type}/${encodeURIComponent(name)}`} className="rounded-2xl border border-slate-700 bg-[#131a24] p-5 font-semibold text-white hover:border-yellow-400 hover:text-yellow-400">{name}</Link>)}
        </div>
    </main>;
}
