import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../utils/axiosInstance';
import { FiVideo, FiUsers, FiUserCheck, FiUserPlus } from 'react-icons/fi';
import { format } from 'timeago.js';
import toast from 'react-hot-toast';

function Channel() {
    const { username } = useParams();
    const { user: currentUser } = useSelector(state => state.auth);
    
    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChannelData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Channel Profile Data
                const channelRes = await axiosInstance.get(`/users/c/${username}`);
                const channelData = channelRes.data.data;
                setChannel(channelData);

                // 2. Fetch Videos for this specific channel
                if (channelData?._id) {
                    const videoRes = await axiosInstance.get(`/videos?userId=${channelData._id}`);
                    setVideos(videoRes.data.data.docs || videoRes.data.data);
                }
            } catch (error) {
                console.error("Error fetching channel:", error);
                toast.error("Channel not found");
            } finally {
                setLoading(false);
            }
        };

        fetchChannelData();
    }, [username]);

    const handleSubscribe = async () => {
        if (!currentUser) return toast.error("Please login to subscribe");
        
        try {
            await axiosInstance.post(`/subscriptions/c/${channel._id}`);
            // Toggle local state to update UI instantly
            setChannel(prev => ({
                ...prev,
                isSubscribed: !prev.isSubscribed,
                subscribersCount: prev.isSubscribed 
                    ? prev.subscribersCount - 1 
                    : prev.subscribersCount + 1
            }));
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Failed to update subscription");
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-400">Loading channel...</div>;
    if (!channel) return <div className="p-8 text-center text-zinc-400">Channel does not exist.</div>;

    const isOwner = currentUser?._id === channel._id;

    return (
        <div className="w-full bg-[#000000] min-h-screen text-white pb-10">
            
            {/* --- 1. CHANNEL BANNER --- */}
            <div className="w-full h-40 sm:h-60 md:h-72 bg-zinc-900 relative">
                {channel.coverImage ? (
                    <img 
                        src={channel.coverImage} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    // Fallback pattern if no cover image
                    <div className="w-full h-full bg-gradient-to-r from-indigo-900/50 to-violet-900/50 flex items-center justify-center">
                        <FiVideo className="text-6xl text-white/10" />
                    </div>
                )}
            </div>

            {/* --- 2. CHANNEL HEADER DETAILS --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 sm:-mt-16 mb-8">
                    
                    {/* Avatar */}
                    <img 
                        src={channel.avatar} 
                        alt={channel.username} 
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-black bg-zinc-800 z-10"
                    />
                    
                    {/* Channel Info */}
                    <div className="flex-1 text-center sm:text-left pt-2 sm:pt-0">
                        <h1 className="text-2xl sm:text-3xl font-bold">{channel.fullName}</h1>
                        <p className="text-zinc-400 font-medium mt-1">@{channel.username}</p>
                        <p className="text-zinc-500 text-sm mt-1 flex items-center justify-center sm:justify-start gap-3">
                            <span>{channel.subscribersCount || 0} subscribers</span>
                            <span>•</span>
                            <span>{videos.length} videos</span>
                        </p>
                    </div>

                    {/* Action Button (Subscribe / Edit) */}
                    <div className="mb-2">
                        {isOwner ? (
                            <Link to="/settings" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-full font-semibold transition-colors border border-white/10">
                                Customize Channel
                            </Link>
                        ) : (
                            <button 
                                onClick={handleSubscribe}
                                className={`px-6 py-2.5 rounded-full font-semibold transition-colors flex items-center gap-2 ${
                                    channel.isSubscribed 
                                    ? "bg-zinc-800 hover:bg-zinc-700 text-white" 
                                    : "bg-white text-black hover:bg-zinc-200"
                                }`}
                            >
                                {channel.isSubscribed ? <><FiUserCheck /> Subscribed</> : <><FiUserPlus /> Subscribe</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* --- 3. TABS --- */}
                <div className="border-b border-white/10 flex gap-8 mb-6">
                    <button className="pb-3 border-b-2 border-white font-medium text-white">Videos</button>
                    {/* You can add 'Playlists', 'About', etc. here later */}
                </div>

                {/* --- 4. VIDEO GRID --- */}
                {videos.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                        <FiVideo className="text-5xl mx-auto mb-4 opacity-20" />
                        <p>This channel has no videos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                        {videos.map((video) => (
                            <Link to={`/watch/${video._id}`} key={video._id} className="group cursor-pointer">
                                <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden mb-3">
                                    <img 
                                        src={video.thumbnail} 
                                        alt={video.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Duration Badge */}
                                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                                        {formatDuration(video.duration)}
                                    </span>
                                </div>
                                <h3 className="text-white font-semibold line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
                                    {video.title}
                                </h3>
                                <p className="text-zinc-500 text-sm mt-1">
                                    {video.views} views • {format(video.createdAt)}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper to format seconds into mm:ss
const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(14, 5);
};

export default Channel;