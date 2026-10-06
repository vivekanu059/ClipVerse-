import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiClock, FiCheckCircle, FiAlertCircle, FiVideo, FiTrash2, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import ConfirmDialog from '../components/ConfirmDialog';
import { timeAgo, compact } from '../utils/format';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'completed', label: 'Published' },
    { id: 'processing', label: 'Processing' },
    { id: 'failed', label: 'Failed' },
];
const inProgress = (s) => s === 'pending' || s === 'processing';

const STATUS = {
    completed: { label: 'Published', cls: 'bg-emerald-400/10 text-emerald-300', icon: <FiCheckCircle /> },
    pending: { label: 'In queue', cls: 'bg-zinc-400/10 text-zinc-300', icon: <FiClock /> },
    processing: { label: 'Transcoding', cls: 'bg-amber-400/10 text-amber-300', icon: <FiLoader className="animate-spin" /> },
    failed: { label: 'Failed', cls: 'bg-red-400/10 text-red-300', icon: <FiAlertCircle /> },
};

function Dashboard() {
    const { user } = useSelector((state) => state.auth);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [toDelete, setToDelete] = useState(null);

    const fetchMyVideos = useCallback(async () => {
        if (!user) return;
        try {
            const res = await axiosInstance.get(`/videos?userId=${user._id}`);
            setVideos(res.data.data.docs || res.data.data);
        } catch (e) {
            console.error('Failed to fetch dashboard videos', e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchMyVideos(); }, [fetchMyVideos]);

    const hasActive = videos.some((v) => inProgress(v.status));
    useEffect(() => {
        if (!hasActive) return;
        const id = setInterval(fetchMyVideos, 5000);
        return () => clearInterval(id);
    }, [hasActive, fetchMyVideos]);

    const confirmDelete = async () => {
        const video = toDelete;
        setToDelete(null);
        setVideos((prev) => prev.filter((v) => v._id !== video._id));
        try {
            await axiosInstance.delete(`/videos/${video._id}`);
            toast.success('Video deleted');
        } catch {
            toast.error("Couldn't delete the video. Try again.");
            fetchMyVideos();
        }
    };

    const stats = useMemo(() => ({
        total: videos.length,
        views: videos.reduce((n, v) => n + (v.views || 0), 0),
        live: videos.filter((v) => v.status === 'completed').length,
        active: videos.filter((v) => inProgress(v.status)).length,
    }), [videos]);

    const shown = videos.filter((v) => filter === 'all' || (filter === 'processing' ? inProgress(v.status) : v.status === filter));

    if (loading) return <div className="grid min-h-[50vh] place-items-center bg-[#0a0a0c] text-zinc-500">Loading your videos…</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0c] font-['DM_Sans',sans-serif] text-zinc-100">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
                <h1 className="font-['Bricolage_Grotesque',sans-serif] text-3xl font-extrabold tracking-tight text-white">Channel dashboard</h1>

                <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 lg:grid-cols-4">
                    {[['Videos', stats.total], ['Total plays', compact(stats.views)], ['Published', stats.live], ['Processing', stats.active]].map(([k, v]) => (
                        <div key={k} className="bg-[#0f0f13] p-5">
                            <dt className="text-sm text-zinc-500">{k}</dt>
                            <dd className="mt-1 text-3xl font-bold tabular-nums text-white">{v}</dd>
                        </div>
                    ))}
                </dl>

                <div className="mt-10 flex gap-1 border-b border-white/10">
                    {FILTERS.map((f) => (
                        <button key={f.id} onClick={() => setFilter(f.id)}
                            className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition ${filter === f.id ? 'border-amber-400 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-200'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {shown.length === 0 ? (
                    <div className="py-24 text-center text-zinc-500">
                        <FiVideo className="mx-auto mb-4 text-5xl opacity-30" />
                        <p>{videos.length === 0 ? "You haven't uploaded anything yet." : 'No videos in this view.'}</p>
                        {videos.length === 0 && <Link to="/upload" className="mt-4 inline-block rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-300">Upload a video</Link>}
                    </div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {shown.map((v) => {
                            const st = STATUS[v.status] || STATUS.pending;
                            const ready = v.status === 'completed';
                            return (
                                <li key={v._id} className="group flex items-center gap-4 py-4 transition hover:bg-white/[0.02] sm:gap-6">
                                    <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-zinc-900 sm:w-44">
                                        <img src={v.thumbnail} alt="" className={`h-full w-full object-cover transition ${ready ? '' : 'opacity-40 grayscale'}`} />
                                        {!ready && v.status !== 'failed' && <span className="absolute inset-x-0 bottom-0 h-1 animate-pulse bg-amber-400" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {ready
                                            ? <Link to={`/watch/${v._id}`} className="line-clamp-1 font-semibold text-white hover:text-amber-300">{v.title}</Link>
                                            : <p className="line-clamp-1 font-semibold text-white">{v.title}</p>}
                                        <p className="mt-1 text-sm text-zinc-500">{timeAgo(v.createdAt)} · {compact(v.views)} plays</p>
                                    </div>
                                    <span className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${st.cls}`}>{st.icon}{st.label}</span>
                                    <button onClick={() => setToDelete(v)} aria-label={`Delete ${v.title}`}
                                        className="rounded-lg p-2.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
                                        <FiTrash2 />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <ConfirmDialog open={!!toDelete} title="Delete this video?"
                body={toDelete ? `"${toDelete.title}" will be permanently removed, along with its plays and comments.` : ''}
                confirmLabel="Delete video" onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
        </div>
    );
}
export default Dashboard;