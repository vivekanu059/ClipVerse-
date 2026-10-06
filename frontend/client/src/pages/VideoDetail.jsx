import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiThumbsUp, FiShare2, FiVideoOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { VideoPlayer } from '../components/VideoPlayer';
import { compact, timeAgo, formatDuration } from '../utils/format';

const Skeleton = () => (
    <div className="mx-auto flex w-full max-w-[1600px] animate-pulse flex-col gap-8 px-4 pt-6 sm:px-8 lg:flex-row">
        <div className="min-w-0 flex-1">
            <div className="aspect-video rounded-2xl bg-white/5" />
            <div className="mt-6 h-8 w-3/4 rounded bg-white/5" />
            <div className="mt-6 flex items-center gap-4"><div className="h-11 w-11 rounded-full bg-white/5" /><div className="h-4 w-40 rounded bg-white/5" /></div>
        </div>
        <div className="hidden w-[380px] space-y-4 lg:block">
            {[1, 2, 3, 4].map((i) => <div key={i} className="flex gap-3"><div className="aspect-video w-40 rounded-lg bg-white/5" /><div className="flex-1 space-y-2 pt-1"><div className="h-4 rounded bg-white/5" /><div className="h-4 w-2/3 rounded bg-white/5" /></div></div>)}
        </div>
    </div>
);

function VideoDetail() {
    const { videoId } = useParams();
    const { user } = useSelector((state) => state.auth);
    const [result, setResult] = useState({ id: null, video: null });
    const [related, setRelated] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    // Derived from the route, so nothing is reset synchronously inside the effect
    const { video } = result;
    const loading = result.id !== videoId;
    const expanded = expandedId === videoId;
    const setVideo = (update) => setResult((r) => ({ ...r, video: typeof update === 'function' ? update(r.video) : update }));

    useEffect(() => {
        let cancelled = false;
        axiosInstance.get(`/videos/${videoId}`)
            .then((res) => !cancelled && setResult({ id: videoId, video: res.data.data }))
            .catch(() => { if (!cancelled) { setResult({ id: videoId, video: null }); toast.error("Couldn't load this video"); } });
        axiosInstance.get('/videos')
            .then((res) => {
                const list = res.data.data.docs || res.data.data;
                if (!cancelled) setRelated(list.filter((v) => v._id !== videoId).slice(0, 10));
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [videoId]);

    const handleLike = async () => {
        if (!user) return toast.error('Log in to like videos');
        const was = video.isLiked;
        const flip = (liked) => setVideo((p) => ({ ...p, isLiked: liked, likesCount: (p.likesCount || 0) + (liked ? 1 : -1) }));
        flip(!was);
        try {
            if (was) await axiosInstance.delete(`/videos/${videoId}/unlike`);
            else await axiosInstance.post(`/videos/${videoId}/like`);
        } catch {
            flip(was);
            toast.error("Couldn't update your like");
        }
    };

    const handleSubscribe = async () => {
        if (!user) return toast.error('Log in to subscribe');
        const was = video.owner.isSubscribed;
        const flip = (subbed) => setVideo((p) => ({ ...p, owner: { ...p.owner, isSubscribed: subbed, subscribersCount: (p.owner.subscribersCount || 0) + (subbed ? 1 : -1) } }));
        flip(!was);
        try {
            if (was) await axiosInstance.delete(`/subscriptions/unsubscribe/${video.owner._id}`);
            else await axiosInstance.post(`/subscriptions/subscribe/${video.owner._id}`);
            toast.success(was ? 'Unsubscribed' : 'Subscribed');
        } catch {
            flip(was);
            toast.error("Couldn't update your subscription");
        }
    };

    const share = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied');
        } catch {
            toast.error("Couldn't copy the link");
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0c]"><Skeleton /></div>;

    if (!video) {
        return (
            <div className="grid min-h-[60vh] place-items-center bg-[#0a0a0c] text-center">
                <div>
                    <FiVideoOff className="mx-auto mb-4 text-5xl text-zinc-700" />
                    <p className="text-lg font-semibold text-white">This video isn't available</p>
                    <p className="mt-1 text-sm text-zinc-500">It may have been removed or is still processing.</p>
                    <Link to="/" className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Back to home</Link>
                </div>
            </div>
        );
    }

    const owner = video.owner;
    const isOwn = user?._id === owner?._id;
    const longDesc = (video.description || '').length > 180;

    return (
        <div className="min-h-screen bg-[#0a0a0c] pb-16 font-['DM_Sans',sans-serif] text-zinc-100">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 pt-4 sm:px-8 sm:pt-6 lg:flex-row">
                <div className="min-w-0 flex-1">
                    <VideoPlayer src={video.videoFile} thumbnail={video.thumbnail} />

                    <h1 className="mt-6 break-words font-['Bricolage_Grotesque',sans-serif] text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">{video.title}</h1>

                    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <Link to={`/c/${owner?.username}`} className="flex min-w-0 items-center gap-3">
                                <img src={owner?.avatar} alt="" className="h-11 w-11 shrink-0 rounded-full bg-zinc-800 object-cover" />
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold text-white">{owner?.username}</span>
                                    <span className="block text-[13px] text-zinc-500">{compact(owner?.subscribersCount)} subscribers</span>
                                </span>
                            </Link>
                            {!isOwn && (
                                <button onClick={handleSubscribe} aria-pressed={!!owner?.isSubscribed}
                                    className={`ml-2 shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition active:scale-95 ${owner?.isSubscribed ? 'bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/15' : 'bg-amber-400 text-black hover:bg-amber-300'}`}>
                                    {owner?.isSubscribed ? 'Subscribed' : 'Subscribe'}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={handleLike} aria-pressed={!!video.isLiked}
                                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition active:scale-95 ${video.isLiked ? 'bg-amber-400 text-black hover:bg-amber-300' : 'bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/15'}`}>
                                <FiThumbsUp className={video.isLiked ? 'fill-current' : ''} /> {compact(video.likesCount)}
                            </button>
                            <button onClick={share} className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15 active:scale-95">
                                <FiShare2 /> Share
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl bg-white/[0.04] p-5 text-sm ring-1 ring-white/5">
                        <p className="font-semibold text-zinc-200">{(video.views || 0).toLocaleString()} plays · {timeAgo(video.createdAt)}</p>
                        <p className={`mt-3 whitespace-pre-wrap leading-relaxed text-zinc-400 ${expanded ? '' : 'line-clamp-3'}`}>{video.description || 'No description.'}</p>
                        {longDesc && <button onClick={() => setExpandedId(expanded ? null : videoId)} className="mt-2 font-semibold text-amber-400 hover:underline">{expanded ? 'Show less' : 'Show more'}</button>}
                    </div>
                </div>

                <aside className="w-full shrink-0 lg:w-[380px]">
                    <h2 className="mb-4 font-semibold text-white">Up next</h2>
                    {related.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-sm text-zinc-500">No other videos yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {related.map((v) => (
                                <li key={v._id}>
                                    <Link to={`/watch/${v._id}`} className="group flex gap-3 rounded-xl p-1.5 transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
                                        <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                                            <img src={v.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                            {v.duration > 0 && <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 text-[10px] font-medium tabular-nums">{formatDuration(v.duration)}</span>}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-200 group-hover:text-white">{v.title}</h3>
                                            <p className="mt-1 text-xs text-zinc-500">{v.owner?.username}</p>
                                            <p className="text-xs text-zinc-500">{compact(v.views)} plays · {timeAgo(v.createdAt)}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>
            </div>
        </div>
    );
}
export default VideoDetail;