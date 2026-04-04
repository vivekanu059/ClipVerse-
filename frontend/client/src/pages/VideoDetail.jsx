import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { VideoPlayer } from '../components/VideoPlayer';
import { FiThumbsUp, FiShare2, FiMoreHorizontal } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { format } from 'timeago.js';
import toast from 'react-hot-toast';

// Premium Skeleton Loader for the Video Page
const VideoDetailSkeleton = () => (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 animate-pulse w-full">
        <div className="flex-1">
            <div className="w-full aspect-video bg-[#111111] rounded-lg"></div>
            <div className="mt-6 h-8 bg-[#111111] rounded-md w-3/4"></div>
            <div className="flex items-center justify-between mt-6 pb-6 border-b border-neutral-900">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-[#111111]"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-[#111111] rounded-sm w-32"></div>
                        <div className="h-3 bg-[#111111] rounded-sm w-24"></div>
                    </div>
                </div>
                <div className="h-10 bg-[#111111] rounded-full w-24"></div>
            </div>
        </div>
        <div className="lg:w-[380px] w-full hidden lg:block space-y-4">
            <div className="h-6 bg-[#111111] rounded-md w-1/3 mb-6"></div>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-3">
                    <div className="w-40 aspect-video bg-[#111111] rounded-md shrink-0"></div>
                    <div className="w-full space-y-2 mt-1">
                        <div className="h-4 bg-[#111111] rounded-sm w-full"></div>
                        <div className="h-4 bg-[#111111] rounded-sm w-2/3"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

function VideoDetail() {
    const { videoId } = useParams();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const res = await axiosInstance.get(`/videos/${videoId}`);
                setVideo(res.data.data);
            } catch (error) {
                console.error("Error fetching video", error);
                toast.error("Could not load video");
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [videoId]);

    const handleLike = async () => {
        if (!user) return toast.error("Please login to like");

        const wasLiked = video.isLiked;

        // 1. Optimistic UI Update
        setVideo((prev) => ({
            ...prev,
            isLiked: !wasLiked,
            likesCount: wasLiked ? prev.likesCount - 1 : prev.likesCount + 1
        }));

        try {
            // 2. Make the API Request
            if (wasLiked) {
                await axiosInstance.delete(`/videos/${videoId}/unlike`);
            } else {
                await axiosInstance.post(`/videos/${videoId}/like`);
            }
        } catch (error) {
            console.error("Like failed:", error); 
            
            // 3. Revert UI on Failure
            setVideo((prev) => ({
                ...prev,
                isLiked: wasLiked,
                likesCount: wasLiked ? prev.likesCount + 1 : prev.likesCount - 1
            }));
            toast.error("Failed to update like");
        }
    };

    const handleSubscribe = async () => {
        if (!user) return toast.error("Please login to subscribe");

        const wasSubscribed = video.owner.isSubscribed;
        
        // 1. Optimistic UI Update
        setVideo((prev) => ({
            ...prev,
            owner: {
                ...prev.owner,
                isSubscribed: !wasSubscribed,
                subscribersCount: wasSubscribed
                    ? prev.owner.subscribersCount - 1 
                    : prev.owner.subscribersCount + 1
            }
        }));

        try {
            // 2. Make API Request
            if (wasSubscribed) {
                await axiosInstance.delete(`/subscriptions/unsubscribe/${video.owner._id}`);
                toast.success("Unsubscribed", { style: { background: '#333', color: '#fff' } });
            } else {
                await axiosInstance.post(`/subscriptions/subscribe/${video.owner._id}`);
                toast.success("Subscribed", { style: { background: '#fff', color: '#000' } });
            }
        } catch (error) {
             console.error("Subscribe failed:", error); 

             // 3. Revert UI on Failure
             setVideo((prev) => ({
                ...prev,
                owner: {
                    ...prev.owner,
                    isSubscribed: wasSubscribed,
                    subscribersCount: wasSubscribed 
                        ? prev.owner.subscribersCount + 1 
                        : prev.owner.subscribersCount - 1
                }
            }));
            toast.error("Failed to update subscription");
        }
    };

    if (loading) return <VideoDetailSkeleton />;
    
    if (!video) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-400 font-sans bg-[#000000]">
            <svg className="w-12 h-12 text-neutral-800 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">Video not found or has been removed.</p>
        </div>
    );

    return (
        <div className="bg-[#000000] min-h-screen text-neutral-100 font-sans selection:bg-neutral-800 pb-12">
            <div className="flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 w-full">
                
                {/* Main Content (Left Side) */}
                <div className="flex-1 min-w-0">
                    
                    {/* Video Player Container */}
                    <div className="w-full aspect-video bg-[#050505] rounded-lg overflow-hidden border border-white/5 relative shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                        <VideoPlayer
                          src={video.videoFile} 
                          thumbnail={video.thumbnail}
                        />
                    </div>

                    {/* Video Title */}
                    <h1 className="text-xl sm:text-2xl font-bold mt-6 text-white tracking-tight leading-snug break-words">
                        {video.title}
                    </h1>
                    
                    {/* Actions Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 pb-5 border-b border-neutral-900 gap-5">
                        
                        {/* Channel Info & Subscribe */}
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <img 
                                src={video.owner?.avatar || "https://via.placeholder.com/40"} 
                                className="w-11 h-11 rounded-full border border-neutral-800 object-cover bg-neutral-900 shrink-0" 
                                alt={video.owner?.username} 
                            />
                            <div className="flex flex-col justify-center min-w-0 pr-2">
                                <p className="font-semibold text-[15px] text-white truncate hover:text-neutral-300 cursor-pointer transition-colors">
                                    {video.owner?.username}
                                </p>
                                <p className="text-[13px] text-neutral-400 truncate">
                                    {video.owner?.subscribersCount || 0} subscribers
                                </p>
                            </div>
                            
                            {/* SUBSCRIBE BUTTON - High Contrast */}
                            {user?._id !== video.owner?._id && (
                                <button 
                                    onClick={handleSubscribe} 
                                    className={`ml-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 shrink-0
                                        ${video.owner?.isSubscribed 
                                            ? "bg-transparent text-neutral-300 border border-neutral-700 hover:bg-neutral-900" 
                                            : "bg-white text-black hover:bg-neutral-200"
                                        }`}
                                >
                                    {video.owner?.isSubscribed ? "Subscribed" : "Subscribe"}
                                </button>
                            )}
                        </div>
                        
                        {/* Interactive Buttons (Like, Share, etc.) */}
                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                            <button 
                                onClick={handleLike} 
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border shrink-0
                                    ${video.isLiked 
                                        ? "bg-white text-black border-white hover:bg-neutral-200" 
                                        : "bg-[#111111] text-neutral-200 border-neutral-800 hover:bg-[#1a1a1a]"
                                    }`}
                            >
                                <FiThumbsUp className={video.isLiked ? "fill-current" : ""} />
                                <span>{video.likesCount}</span>
                            </button>

                            {/* Optional: Dummy Share/More buttons to complete the UI */}
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[#111111] text-neutral-200 border border-neutral-800 hover:bg-[#1a1a1a] transition-colors shrink-0">
                                <FiShare2 />
                                <span>Share</span>
                            </button>
                            <button className="flex items-center justify-center w-9 h-9 rounded-full bg-[#111111] text-neutral-200 border border-neutral-800 hover:bg-[#1a1a1a] transition-colors shrink-0">
                                <FiMoreHorizontal />
                            </button>
                        </div>
                    </div>

                    {/* Description Box - Minimalist, no heavy background */}
                    <div className="mt-6 bg-[#0a0a0a] border border-neutral-900/50 p-4 sm:p-5 rounded-lg text-sm transition-colors hover:bg-[#0d0d0d]">
                        <p className="font-semibold text-neutral-200 mb-3 text-[13px]">
                            {video.views} plays <span className="mx-1.5 text-neutral-700">•</span> {format(video.createdAt)}
                        </p>
                        <p className="text-neutral-400 whitespace-pre-wrap leading-relaxed">
                            {video.description || "No description provided."}
                        </p>
                    </div>
                </div>

                {/* Sidebar (Up Next) */}
                <div className="lg:w-[380px] w-full shrink-0">
                    <h3 className="font-semibold mb-5 text-lg text-white tracking-tight border-b border-neutral-900 pb-2">
                        Up Next
                    </h3>
                    <div className="flex flex-col gap-4">
                        {/* Placeholder for related videos - Styled elegantly */}
                        <div className="text-neutral-500 text-sm py-4 text-center border border-dashed border-neutral-800 rounded-lg">
                            No related videos found.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default VideoDetail;