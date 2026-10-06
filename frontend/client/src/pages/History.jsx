import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiTrash2, FiPlay, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDuration, timeAgo, compact } from '../utils/format';

function WatchHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [confirming, setConfirming] = useState(false);

    const fetchHistory = async () => {
        try {
            const res = await axiosInstance.get('/users/history');
            setHistory(res.data.data);
        } catch (e) {
            console.error('Failed to fetch history', e);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchHistory(); }, []);

    const clearHistory = async () => {
        setConfirming(false);
        setHistory([]);
        try {
            await axiosInstance.delete('/users/history/clear');
            toast.success('Watch history cleared');
        } catch {
            toast.error("Couldn't clear your history");
            fetchHistory();
        }
    };

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return history.filter((v) => !q || v.title?.toLowerCase().includes(q) || v.owner?.username?.toLowerCase().includes(q));
    }, [history, query]);

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl space-y-6 bg-[#0a0a0c] px-4 py-12">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex animate-pulse gap-5">
                        <div className="aspect-video w-56 rounded-xl bg-white/5" />
                        <div className="flex-1 space-y-3 pt-2"><div className="h-5 w-2/3 rounded bg-white/5" /><div className="h-3 w-1/3 rounded bg-white/5" /></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] font-['DM_Sans',sans-serif] text-zinc-100">
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-['Bricolage_Grotesque',sans-serif] text-3xl font-extrabold tracking-tight text-white">Watch history</h1>
                        <p className="mt-1.5 text-sm text-zinc-500">{history.length} {history.length === 1 ? 'video' : 'videos'}, most recent first</p>
                    </div>
                    {history.length > 0 && (
                        <button onClick={() => setConfirming(true)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-400 ring-1 ring-white/10 transition hover:bg-red-500/10 hover:text-red-300 hover:ring-red-500/30">
                            <FiTrash2 /> Clear history
                        </button>
                    )}
                </div>

                {history.length > 0 && (
                    <label className="relative mt-8 block">
                        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your history"
                            className="w-full rounded-xl bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none ring-1 ring-transparent transition placeholder:text-zinc-500 focus:ring-amber-400/70" />
                    </label>
                )}

                {history.length === 0 ? (
                    <div className="py-28 text-center">
                        <FiClock className="mx-auto mb-5 text-5xl text-zinc-700" />
                        <h2 className="text-xl font-semibold text-white">Nothing watched yet</h2>
                        <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">Videos you play will show up here so you can pick up where you left off.</p>
                        <Link to="/" className="mt-6 inline-block rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-black hover:bg-amber-300">Find something to watch</Link>
                    </div>
                ) : shown.length === 0 ? (
                    <p className="py-20 text-center text-zinc-500">No videos match "{query}".</p>
                ) : (
                    <ul className="mt-6 space-y-1">
                        {shown.map((v) => (
                            <li key={v._id}>
                                <Link to={`/watch/${v._id}`} className="group flex flex-col gap-4 rounded-2xl p-3 transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 sm:flex-row sm:gap-6">
                                    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-zinc-900 sm:w-60">
                                        <img src={v.thumbnail} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                        <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100"><FiPlay className="text-3xl text-white" /></span>
                                        {v.duration > 0 && <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums">{formatDuration(v.duration)}</span>}
                                    </div>
                                    <div className="min-w-0 py-1">
                                        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-zinc-100 group-hover:text-white">{v.title}</h3>
                                        <p className="mt-1.5 text-sm text-zinc-500">{v.owner?.username} · {compact(v.views)} plays · {timeAgo(v.createdAt)}</p>
                                        <p className="mt-3 hidden line-clamp-2 text-sm leading-relaxed text-zinc-500 sm:block">{v.description}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <ConfirmDialog open={confirming} title="Clear your watch history?" body="This removes every video from your history. It can't be undone."
                confirmLabel="Clear history" onConfirm={clearHistory} onCancel={() => setConfirming(false)} />
        </div>
    );
}
export default WatchHistory;