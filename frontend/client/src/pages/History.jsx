import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Link } from 'react-router-dom';
import { FiClock, FiTrash2, FiPlayCircle } from 'react-icons/fi';

// 1. Native helper to format duration (mm:ss)
const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// 2. Custom helper to replace timeago.js! 
const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return "just now";
};

function WatchHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axiosInstance.get("/users/history");
            setHistory(res.data.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = async () => {
        if (!window.confirm("Are you sure you want to clear your entire watch history?")) return;
        
        setHistory([]);
        try {
            await axiosInstance.delete("/users/history/clear");
        } catch (error) {
            console.error("Failed to clear history", error);
            fetchHistory(); 
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] bg-[#000000]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] text-neutral-100 font-sans pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                
                {/* Header Area */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                            <FiClock className="text-indigo-500" /> Watch History
                        </h1>
                        <p className="text-zinc-400 mt-2 text-sm">Videos you have watched recently.</p>
                    </div>
                    
                    {history.length > 0 && (
                        <button 
                            onClick={clearHistory}
                            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                        >
                            <FiTrash2 /> Clear watch history
                        </button>
                    )}
                </div>

                {/* History List */}
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <FiClock className="text-4xl text-zinc-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Keep track of what you watch</h2>
                        <p className="text-zinc-400 max-w-sm">
                            Watch history isn't viewable when it's empty. Go watch some amazing videos!
                        </p>
                        <Link to="/" className="mt-6 bg-white text-black px-6 py-2.5 rounded-full font-semibold hover:bg-zinc-200 transition-colors">
                            Explore Videos
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">
                        {history.map((video) => (
                            <Link 
                                to={`/watch/${video._id}`} 
                                key={video._id} 
                                className="group flex flex-col sm:flex-row gap-4 sm:gap-6 p-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-full sm:w-64 aspect-video rounded-lg overflow-hidden bg-[#111] shrink-0">
                                    <img 
                                        src={video.thumbnail} 
                                        alt={video.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <FiPlayCircle className="text-4xl text-white drop-shadow-lg" />
                                    </div>
                                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-md text-white px-1.5 py-0.5 text-xs font-medium rounded tracking-wide">
                                        {formatDuration(video.duration)}
                                    </span>
                                </div>

                                {/* Video Details */}
                                <div className="flex flex-col justify-start py-1 w-full overflow-hidden">
                                    <h3 className="text-lg sm:text-xl font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight mb-2">
                                        {video.title}
                                    </h3>
                                    
                                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                                        <span className="font-medium hover:text-white transition-colors">{video.owner?.username}</span>
                                        <span>•</span>
                                        <span>{video.views} views</span>
                                        <span>•</span>
                                        {/* Using our new custom function here! */}
                                        <span>{formatTimeAgo(video.createdAt)}</span>
                                    </div>

                                    <p className="text-sm text-zinc-500 line-clamp-2 hidden sm:block">
                                        {video.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default WatchHistory;