import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../utils/axiosInstance';
import { FiClock, FiCheckCircle, FiAlertCircle, FiVideo, FiTrash2 } from 'react-icons/fi';
import { format } from 'timeago.js';
import toast from 'react-hot-toast';

function Dashboard() {
    const { user } = useSelector(state => state.auth);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyVideos = async () => {
        if (!user) return;
        try {
            const res = await axiosInstance.get(`/videos?userId=${user._id}`);
            setVideos(res.data.data.docs || res.data.data);
        } catch (error) {
            console.error("Failed to fetch dashboard videos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyVideos();
    }, [user]);

    // --- REAL-TIME POLLING ---
    useEffect(() => {
        const hasProcessingVideos = videos.some(
            (v) => v.status === 'pending' || v.status === 'processing'
        );

        let intervalId;
        if (hasProcessingVideos) {
            intervalId = setInterval(() => {
                fetchMyVideos();
            }, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [videos]);

    // --- DELETE VIDEO HANDLER ---
    const handleDelete = async (videoId) => {
        // Confirm before deleting
        if (!window.confirm("Are you sure you want to permanently delete this video?")) return;
        
        try {
            // Optimistically remove it from the UI immediately for a snappy feel
            setVideos((prevVideos) => prevVideos.filter(v => v._id !== videoId));
            
            // Tell the backend to delete it
            await axiosInstance.delete(`/videos/${videoId}`);
            toast.success("Video deleted successfully", {
                style: { background: '#18181b', color: '#fff', border: '1px solid #ef4444' }
            });
            
        } catch (error) {
            console.error("Error deleting video", error);
            toast.error("Failed to delete video. Please try again.");
            // If it failed, fetch the videos again to restore the UI
            fetchMyVideos(); 
        }
    };

    if (loading) return <div className="text-zinc-400 p-8">Loading dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">
                Channel Dashboard
            </h1>

            {videos.length === 0 ? (
                <div className="text-center text-zinc-500 py-20">
                    <FiVideo className="text-5xl mx-auto mb-4 opacity-20" />
                    <p>You haven't uploaded any videos yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map((video) => (
                        <div key={video._id} className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden shadow-lg flex flex-col group relative">
                            
                            {/* --- DELETE BUTTON (Shows on Hover) --- */}
                            <button 
                                onClick={() => handleDelete(video._id)}
                                className="absolute top-2 right-2 z-20 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg backdrop-blur-sm"
                                title="Delete Video"
                            >
                                <FiTrash2 />
                            </button>

                            {/* Thumbnail Area with Status Overlay */}
                            <div className="relative aspect-video bg-black">
                                <img 
                                    src={video.thumbnail} 
                                    alt={video.title} 
                                    className={`w-full h-full object-cover transition-all ${
                                        video.status !== 'completed' ? 'opacity-30 blur-sm grayscale' : ''
                                    }`}
                                />
                                
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                                    {video.status === 'pending' && (
                                        <div className="bg-zinc-900/90 text-zinc-300 px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-xl backdrop-blur-sm">
                                            <FiClock className="animate-spin" /> In Queue...
                                        </div>
                                    )}
                                    
                                    {video.status === 'processing' && (
                                        <div className="bg-indigo-600/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-xl backdrop-blur-sm">
                                            <FiClock className="animate-pulse" /> Transcoding (HLS)...
                                        </div>
                                    )}

                                    {video.status === 'failed' && (
                                        <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-xl backdrop-blur-sm">
                                            <FiAlertCircle /> Processing Failed
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Video Details */}
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="text-white font-semibold line-clamp-2 text-sm mb-2">
                                    {video.title}
                                </h3>
                                
                                <div className="mt-auto flex items-center justify-between text-xs text-zinc-400 border-t border-white/5 pt-3">
                                    <span>{format(video.createdAt)}</span>
                                    
                                    {video.status === 'completed' ? (
                                        <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded">
                                            <FiCheckCircle /> Published
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                                            <FiClock /> Processing
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;