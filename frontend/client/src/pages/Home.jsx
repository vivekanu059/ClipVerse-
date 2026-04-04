import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';

// Robust duration formatter
const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// Sleek, minimal skeleton loader matching the new grid
const VideoSkeleton = () => (
    <div className="flex flex-col w-full animate-pulse">
        <div className="w-full aspect-video bg-[#111111] rounded-md mb-3"></div>
        <div className="flex gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#111111] shrink-0"></div>
            <div className="flex flex-col gap-2 w-full pt-1.5">
                <div className="h-3.5 bg-[#111111] rounded-sm w-5/6"></div>
                <div className="h-3 bg-[#111111] rounded-sm w-1/2"></div>
            </div>
        </div>
    </div>
);

function Home() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    // 1. Initialize the navigate hook
    const navigate = useNavigate(); 

    useEffect(() => {
        axiosInstance.get("/videos")
            .then(res => {
                setVideos(res.data.data.docs || res.data.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch videos", err);
                setError(true);
                setLoading(false);
            });
    }, []);

    // 2. Click handler to intercept clicks and route to the channel
    const handleChannelClick = (e, username) => {
        e.preventDefault(); // Stop the outer Link
        e.stopPropagation(); // Stop the click from bubbling
        navigate(`/c/${username}`);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-400 font-sans bg-[#000000]">
                <svg className="w-12 h-12 text-neutral-800 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-medium text-neutral-500">Unable to load feed. Please refresh.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] text-neutral-100 font-sans selection:bg-neutral-800">
            
            {/* Wide, cinematic container */}
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
                
                {/* Elegant Section Header */}
                <div className="mb-8 px-1 flex items-end justify-between border-b border-neutral-900 pb-4">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                        Staff Picks
                    </h2>
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                        View All
                    </span>
                </div>

                {/* Video Grid - Increased gap-y for editorial breathing room */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-12">
                    
                    {loading ? (
                        Array.from({ length: 10 }).map((_, idx) => <VideoSkeleton key={idx} />)
                    ) : (
                        videos.map((video) => (
                            <Link to={`/watch/${video._id}`} key={video._id} className="group flex flex-col cursor-pointer">
                                
                                {/* Thumbnail Container */}
                                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-[#0a0a0a] mb-3.5 border border-white/5">
                                    <img 
                                        src={video.thumbnail} 
                                        alt={video.title} 
                                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-75" 
                                        loading="lazy"
                                    />
                                    
                                    {/* Frosted Glass Play Button Overlay (Vimeo Signature) */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                        <div className="bg-black/40 backdrop-blur-md rounded-full p-3 border border-white/10 shadow-2xl transform scale-95 group-hover:scale-100 transition-transform duration-300">
                                            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Duration Badge */}
                                    <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white px-2 py-0.5 text-[11px] font-medium rounded-md tracking-wide">
                                        {formatDuration(video.duration)}
                                    </span>
                                </div>

                                {/* Metadata Container */}
                                <div className="flex gap-3.5 items-start px-1">
                                    
                                    {/* 3. Updated Avatar with click handler and z-index */}
                                    <img 
                                        onClick={(e) => handleChannelClick(e, video.owner.username)}
                                        src={video.owner.avatar} 
                                        className="w-9 h-9 rounded-full object-cover bg-neutral-900 border border-neutral-800 shrink-0 mt-0.5 relative z-10 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all" 
                                        alt={video.owner.username} 
                                        title={`Visit ${video.owner.username}'s channel`}
                                    />
                                    
                                    {/* Text Data */}
                                    <div className="flex flex-col overflow-hidden">
                                        <h3 className="font-semibold text-[15px] text-neutral-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                                            {video.title}
                                        </h3>
                                        
                                        <div className="text-[13px] text-neutral-400 mt-1.5 flex flex-col">
                                            {/* 4. Updated Username with click handler and z-index */}
                                            <span 
                                                onClick={(e) => handleChannelClick(e, video.owner.username)}
                                                className="font-medium hover:text-white transition-colors cursor-pointer relative z-10 w-max"
                                            >
                                                {video.owner.username}
                                            </span>
                                            
                                            <span className="text-neutral-500 mt-0.5">
                                                {video.views} plays <span className="mx-1 text-neutral-700">•</span> {format(video.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default Home;