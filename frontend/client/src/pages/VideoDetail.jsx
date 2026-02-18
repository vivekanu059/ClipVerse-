import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { VideoPlayer } from '../components/VideoPlayer';
import { FiThumbsUp } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { format } from 'timeago.js';
import toast from 'react-hot-toast';

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

        // 1. Optimistic UI Update (Update UI instantly)
        setVideo((prev) => ({
            ...prev,
            isLiked: !wasLiked,
            likesCount: wasLiked ? prev.likesCount - 1 : prev.likesCount + 1
        }));

        try {
            // 2. Make the API Request
            if (wasLiked) {
                // If it was liked, we UNLIKE it
                await axiosInstance.delete(`/videos/${videoId}/unlike`);
            } else {
                // If it wasn't liked, we LIKE it
                await axiosInstance.post(`/videos/${videoId}/like`);
            }
        } catch (error) {
            console.error("Like failed:", error); // Log error to remove red underline
            
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
                toast.success("Unsubscribed");
            } else {
                await axiosInstance.post(`/subscriptions/subscribe/${video.owner._id}`);
                toast.success("Subscribed");
            }
        } catch (error) {
             console.error("Subscribe failed:", error); // Log error to remove red underline

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

    if (loading) return <div className="text-center mt-20 text-lg animate-pulse">Loading Video...</div>;
    if (!video) return <div className="text-center mt-20 text-red-500">Video not found</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto">
            <div className="flex-1">
                {/* Video Player Container */}
                <div className="rounded-xl overflow-hidden border border-gray-800 shadow-2xl bg-black relative w-full aspect-video">
                    <VideoPlayer
                      src={video.videoFile} thumbnail={video.thumbnail}
                    //    src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" 
                    //      thumbnail={video.thumbnail} 
                    />
                </div>

                {/* Title */}
                <h1 className="text-xl font-bold mt-4 text-white">{video.title}</h1>
                
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pb-4 border-b border-gray-800 gap-4">
                    {/* Channel Info */}
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <img 
                            src={video.owner?.avatar || "https://via.placeholder.com/40"} 
                            className="w-10 h-10 rounded-full border border-gray-700 object-cover" 
                            alt={video.owner?.username} 
                        />
                        <div>
                            <p className="font-semibold text-white">{video.owner?.username}</p>
                            <p className="text-xs text-gray-400">{video.owner?.subscribersCount || 0} subscribers</p>
                        </div>
                        
                        {/* SUBSCRIBE BUTTON */}
                        {user?._id !== video.owner?._id && (
                            <button 
                                onClick={handleSubscribe} 
                                className={`px-5 py-2 rounded-full font-medium transition duration-200 ml-4 
                                    ${video.owner?.isSubscribed 
                                        ? "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]" 
                                        : "bg-white text-black hover:bg-gray-200"
                                    }`}
                            >
                                {video.owner?.isSubscribed ? "Subscribed" : "Subscribe"}
                            </button>
                        )}
                    </div>
                    
                    {/* Like Button */}
                    <div className="flex gap-2">
                        <button 
                            onClick={handleLike} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition duration-200 
                                ${video.isLiked ? "bg-[#2d2d2d] text-purple-500" : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"}`}
                        >
                            <FiThumbsUp className={video.isLiked ? "fill-current" : ""} />
                            <span>{video.likesCount}</span>
                        </button>
                    </div>
                </div>

                {/* Description Box */}
                <div className="mt-4 bg-[#2d2d2d] p-4 rounded-xl text-sm hover:bg-[#333] transition">
                    <p className="font-bold text-white mb-2">
                        {video.views} views • {format(video.createdAt)}
                    </p>
                    <p className="text-gray-200 whitespace-pre-wrap">{video.description}</p>
                </div>
            </div>

            {/* Sidebar (Up Next) */}
            <div className="lg:w-80 w-full hidden lg:block">
                <h3 className="font-bold mb-4 text-lg">Up Next</h3>
                <div className="text-gray-500 text-sm">No related videos yet.</div>
            </div>
        </div>
    );
}

export default VideoDetail;