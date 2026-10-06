import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import axiosInstance from '../utils/axiosInstance';
import { formatDuration, timeAgo, compact } from '../utils/format';

function Search() {
    const { query } = useParams();
    const [result, setResult] = useState({ query: null, videos: [], error: false });

    useEffect(() => {
        let cancelled = false;
        axiosInstance.get('/videos', { params: { query } })
            .then((res) => !cancelled && setResult({ query, videos: res.data.data.docs || res.data.data, error: false }))
            .catch(() => !cancelled && setResult({ query, videos: [], error: true }));
        return () => { cancelled = true; };
    }, [query]);

    // Derived, so no setState is needed synchronously inside the effect
    const loading = result.query !== query;
    const { videos, error } = result;

    return (
        <div className="min-h-screen bg-[#0a0a0c] font-['DM_Sans',sans-serif] text-zinc-100">
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
                <h1 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Results for "{query}"</h1>
                {!loading && !error && <p className="mt-1.5 text-sm text-zinc-500">{videos.length} {videos.length === 1 ? 'video' : 'videos'} found</p>}

                {loading ? (
                    <div className="mt-8 space-y-6">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="flex animate-pulse gap-5">
                                <div className="aspect-video w-60 rounded-xl bg-white/5 sm:w-80" />
                                <div className="flex-1 space-y-3 pt-2"><div className="h-5 w-2/3 rounded bg-white/5" /><div className="h-3 w-1/3 rounded bg-white/5" /></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <p className="py-24 text-center text-zinc-400">Search didn't work. Check your connection and try again.</p>
                ) : videos.length === 0 ? (
                    <div className="py-24 text-center">
                        <FiSearch className="mx-auto mb-4 text-5xl text-zinc-700" />
                        <p className="text-lg font-semibold text-white">No videos match "{query}"</p>
                        <p className="mt-1 text-sm text-zinc-500">Check the spelling or try fewer keywords.</p>
                    </div>
                ) : (
                    <ul className="mt-6 space-y-1">
                        {videos.map((v) => (
                            <li key={v._id}>
                                <Link to={`/watch/${v._id}`} className="group flex flex-col gap-4 rounded-2xl p-3 transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 sm:flex-row sm:gap-6">
                                    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-zinc-900 sm:w-80">
                                        <img src={v.thumbnail} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                        {v.duration > 0 && <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums">{formatDuration(v.duration)}</span>}
                                    </div>
                                    <div className="min-w-0 py-1">
                                        <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-zinc-100 group-hover:text-white sm:text-xl">{v.title}</h2>
                                        <p className="mt-1.5 text-sm text-zinc-500">{compact(v.views)} plays · {timeAgo(v.createdAt)}</p>
                                        {v.owner && (
                                            <span className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                                                <img src={v.owner.avatar} alt="" className="h-6 w-6 rounded-full bg-zinc-800 object-cover" />{v.owner.username}
                                            </span>
                                        )}
                                        <p className="mt-3 hidden line-clamp-2 text-sm leading-relaxed text-zinc-500 sm:block">{v.description}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
export default Search;