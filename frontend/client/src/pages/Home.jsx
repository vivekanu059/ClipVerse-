import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiPlay } from 'react-icons/fi';
import axiosInstance from '../utils/axiosInstance';
import VideoCard from '../components/VideoCard';
import { compact, timeAgo } from '../utils/format';

const SORTS = [
    { id: 'latest', label: 'Latest' },
    { id: 'popular', label: 'Most played' },
];

const Skeleton = () => (
    <div className="animate-pulse">
        <div className="aspect-video rounded-xl bg-white/5" />
        <div className="mt-3 h-4 w-5/6 rounded bg-white/5" />
        <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
    </div>
);

function Home() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('latest');

    useEffect(() => {
        axiosInstance.get('/videos', { params: { limit: 24 } })
            .then((res) => setVideos(res.data.data.docs || res.data.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    const featured = useMemo(() => [...videos].sort((a, b) => b.views - a.views)[0], [videos]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = videos.filter((v) => !q || v.title?.toLowerCase().includes(q) || v.owner?.username?.toLowerCase().includes(q));
        return list.sort((a, b) => sort === 'popular' ? b.views - a.views : new Date(b.createdAt) - new Date(a.createdAt));
    }, [videos, query, sort]);

    if (error) {
        return (
            <div className="grid min-h-[60vh] place-items-center bg-[#0a0a0c] px-6 text-center">
                <div>
                    <p className="text-lg font-semibold text-white">The feed didn't load</p>
                    <p className="mt-1 text-sm text-zinc-400">Check your connection and try again.</p>
                    <button onClick={() => window.location.reload()} className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Reload feed</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-['DM_Sans',sans-serif] selection:bg-amber-400/30">
            {!loading && featured && !query && (
                <section className="relative isolate overflow-hidden">
                    <img src={featured.thumbnail} alt="" className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover blur-2xl opacity-40" />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#0a0a0c]/60 to-[#0a0a0c]" />
                    <div className="mx-auto grid max-w-[1600px] items-center gap-8 px-4 pb-10 pt-10 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:pt-16">
                        <Link to={`/watch/${featured._id}`} className="group relative block aspect-video overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
                            <img src={featured.thumbnail} alt={featured.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                            <span className="absolute inset-0 grid place-items-center bg-black/20 transition group-hover:bg-black/10">
                                <span className="grid h-16 w-16 place-items-center rounded-full bg-amber-400 text-black shadow-xl transition group-hover:scale-110"><FiPlay className="ml-1 text-2xl" /></span>
                            </span>
                        </Link>
                        <div>
                            <p className="text-sm font-medium text-amber-400">Most played right now</p>
                            <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">{featured.title}</h1>
                            <p className="mt-4 text-zinc-400">{featured.owner?.username} · {compact(featured.views)} plays · {timeAgo(featured.createdAt)}</p>
                            <Link to={`/watch/${featured._id}`} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 active:scale-95">
                                <FiPlay /> Watch now
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-8">
                <div className="sticky top-0 z-20 -mx-4 mb-8 flex flex-wrap items-center justify-between gap-3 bg-[#0a0a0c]/85 px-4 py-3 backdrop-blur-lg sm:-mx-8 sm:px-8">
                    <div className="flex gap-1 rounded-full bg-white/5 p-1" role="tablist">
                        {SORTS.map((s) => (
                            <button key={s.id} role="tab" aria-selected={sort === s.id} onClick={() => setSort(s.id)}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${sort === s.id ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <label className="relative w-full sm:w-72">
                        <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles or creators"
                            className="w-full rounded-full bg-white/5 py-2 pl-10 pr-4 text-sm text-white outline-none ring-1 ring-transparent transition placeholder:text-zinc-500 focus:ring-amber-400/70" />
                    </label>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {loading ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} />)
                        : visible.map((v) => <VideoCard key={v._id} video={v} />)}
                </div>

                {!loading && visible.length === 0 && (
                    <div className="py-24 text-center">
                        <p className="text-lg font-semibold text-white">{query ? `Nothing matches "${query}"` : 'No videos yet'}</p>
                        {query && <button onClick={() => setQuery('')} className="mt-3 text-sm font-medium text-amber-400 hover:underline">Clear search</button>}
                    </div>
                )}
            </div>
        </div>
    );
}
export default Home;