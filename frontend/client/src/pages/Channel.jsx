import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiVideo, FiUserCheck, FiUserPlus, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import VideoCard from '../components/VideoCard';
import { compact } from '../utils/format';

function Channel() {
    const { username } = useParams();
    const { user: currentUser } = useSelector((state) => state.auth);
    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState('latest');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { data } = await axiosInstance.get(`/users/c/${username}`);
                if (cancelled) return;
                setChannel(data.data);
                if (data.data?._id) {
                    const v = await axiosInstance.get(`/videos?userId=${data.data._id}`);
                    if (!cancelled) setVideos(v.data.data.docs || v.data.data);
                }
            } catch {
                if (!cancelled) { setChannel(null); toast.error('Channel not found'); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [username]);

    const sorted = useMemo(() => [...videos].sort((a, b) =>
        sort === 'popular' ? b.views - a.views : new Date(b.createdAt) - new Date(a.createdAt)), [videos, sort]);

    const toggleSubscribe = async () => {
        if (!currentUser) return toast.error('Log in to subscribe');
        if (busy) return;
        const apply = (p) => ({ ...p, isSubscribed: !p.isSubscribed, subscribersCount: (p.subscribersCount || 0) + (p.isSubscribed ? -1 : 1) });
        const was = !!channel.isSubscribed;
        setBusy(true);
        setChannel(apply);
        try {
            if (was) await axiosInstance.delete(`/subscriptions/unsubscribe/${channel._id}`);
            else await axiosInstance.post(`/subscriptions/subscribe/${channel._id}`);
        } catch {
            setChannel(apply);
            toast.error("Couldn't update your subscription");
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen animate-pulse bg-[#0a0a0c]">
                <div className="h-48 bg-white/5 md:h-72" />
                <div className="mx-auto -mt-14 max-w-7xl px-6"><div className="h-28 w-28 rounded-full bg-white/10 ring-4 ring-[#0a0a0c]" /></div>
            </div>
        );
    }
    if (!channel) {
        return (
            <div className="grid min-h-[60vh] place-items-center bg-[#0a0a0c] text-center">
                <div>
                    <p className="text-lg font-semibold text-white">This channel doesn't exist</p>
                    <Link to="/" className="mt-3 inline-block text-sm font-medium text-amber-400 hover:underline">Back to home</Link>
                </div>
            </div>
        );
    }

    const isOwner = currentUser?._id === channel._id;
    const totalViews = videos.reduce((n, v) => n + (v.views || 0), 0);

    return (
        <div className="min-h-screen bg-[#0a0a0c] pb-16 text-zinc-100 font-['DM_Sans',sans-serif]">
            <div className="relative h-48 overflow-hidden bg-zinc-900 sm:h-64 md:h-80">
                {channel.coverImage
                    ? <img src={channel.coverImage} alt="" className="h-full w-full object-cover" />
                    : <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_left,#3a2a0a,#0a0a0c_70%)]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-8">
                <div className="-mt-14 flex flex-col items-center gap-5 sm:-mt-16 sm:flex-row sm:items-end">
                    <img src={channel.avatar} alt={channel.username} className="relative z-10 h-28 w-28 rounded-full bg-zinc-800 object-cover ring-4 ring-[#0a0a0c] sm:h-36 sm:w-36" />
                    <div className="flex-1 text-center sm:pb-2 sm:text-left">
                        <h1 className="font-['Bricolage_Grotesque',sans-serif] text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{channel.fullName}</h1>
                        <p className="mt-1 text-zinc-400">@{channel.username}</p>
                        <p className="mt-2 text-sm text-zinc-500">
                            <b className="font-semibold text-zinc-200">{compact(channel.subscribersCount)}</b> subscribers &nbsp;
                            <b className="font-semibold text-zinc-200">{videos.length}</b> videos &nbsp;
                            <b className="font-semibold text-zinc-200">{compact(totalViews)}</b> plays
                        </p>
                    </div>
                    {isOwner ? (
                        <Link to="/settings" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15 sm:mb-2">
                            <FiSettings /> Customize channel
                        </Link>
                    ) : (
                        <button onClick={toggleSubscribe} aria-pressed={!!channel.isSubscribed}
                            className={`inline-flex min-w-[9.5rem] items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition active:scale-95 sm:mb-2 ${channel.isSubscribed ? 'bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/15' : 'bg-amber-400 text-black hover:bg-amber-300'}`}>
                            {channel.isSubscribed ? <><FiUserCheck /> Subscribed</> : <><FiUserPlus /> Subscribe</>}
                        </button>
                    )}
                </div>

                <div className="mt-10 flex items-center justify-between border-b border-white/10">
                    <h2 className="border-b-2 border-amber-400 pb-3 text-sm font-semibold text-white">Videos</h2>
                    <div className="flex gap-1 pb-2">
                        {[['latest', 'Latest'], ['popular', 'Popular']].map(([id, label]) => (
                            <button key={id} onClick={() => setSort(id)} className={`rounded-full px-3 py-1 text-sm transition ${sort === id ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}>{label}</button>
                        ))}
                    </div>
                </div>

                {sorted.length === 0 ? (
                    <div className="py-24 text-center text-zinc-500">
                        <FiVideo className="mx-auto mb-4 text-5xl opacity-30" />
                        <p>{isOwner ? 'Upload your first video to fill this page.' : "This channel hasn't posted yet."}</p>
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {sorted.map((v) => <VideoCard key={v._id} video={v} showOwner={false} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
export default Channel;