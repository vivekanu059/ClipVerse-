import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiVideo, FiImage } from 'react-icons/fi';

function UploadVideo() {
    const { register, handleSubmit, reset } = useForm();
    
    // UI States
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        setUploadProgress(0);
        setIsProcessing(false);

        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("videoFile", data.videoFile[0]);
        formData.append("thumbnail", data.thumbnail[0]);

        try {
            await axiosInstance.post("/videos/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                // --- PROGRESS TRACKING MAGIC ---
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                    
                    // Once the network upload is at 100%, the backend is transcoding
                    if (percentCompleted === 100) {
                        setIsProcessing(true);
                    }
                }
            });
            
            toast.success("Video uploaded! It is being processed.", { 
                style: { background: '#4f46e5', color: '#fff' } 
            });
            
            reset();
            setUploadProgress(0);
            setIsProcessing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Upload failed");
            setUploadProgress(0);
            setIsProcessing(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#09090b] text-zinc-300 font-sans py-10 px-4 sm:px-6 relative overflow-hidden flex justify-center">
            
            {/* Subtle Ambient Glow to cure the "dullness" */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>

            {/* Main Upload Card */}
            <div className="w-full max-w-3xl bg-[#18181b]/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl relative z-10 overflow-hidden">
                
                {/* Header Section */}
                <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                            <FiUploadCloud className="text-white text-lg" /> 
                        </div>
                        Upload Video
                    </h2>
                    <p className="text-sm text-zinc-400 mt-2 pl-11">
                        Share your high-quality content with your audience.
                    </p>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                    
                    {/* File Upload Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Video File Dropzone */}
                        <div className="relative group border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500/50 hover:bg-white/[0.02] transition-all cursor-pointer bg-[#09090b]/50 shadow-inner">
                            <div className="w-12 h-12 rounded-full bg-[#18181b] border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-indigo-500/30 transition-all shadow-lg">
                                <FiVideo className="text-indigo-400 text-xl" />
                            </div>
                            <label className="cursor-pointer w-full">
                                <span className="block mb-1 text-sm font-semibold text-zinc-200">Video File</span>
                                <span className="block mb-4 text-xs text-zinc-500">MP4, WebM, or OGG</span>
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    disabled={loading}
                                    {...register("videoFile", { required: true })} 
                                    className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-300 hover:file:bg-indigo-500/20 transition-colors cursor-pointer disabled:opacity-50" 
                                />
                            </label>
                        </div>

                        {/* Thumbnail Dropzone */}
                        <div className="relative group border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-violet-500/50 hover:bg-white/[0.02] transition-all cursor-pointer bg-[#09090b]/50 shadow-inner">
                            <div className="w-12 h-12 rounded-full bg-[#18181b] border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-violet-500/30 transition-all shadow-lg">
                                <FiImage className="text-violet-400 text-xl" />
                            </div>
                            <label className="cursor-pointer w-full">
                                <span className="block mb-1 text-sm font-semibold text-zinc-200">Thumbnail</span>
                                <span className="block mb-4 text-xs text-zinc-500">JPG, PNG, or WEBP</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    disabled={loading}
                                    {...register("thumbnail", { required: true })} 
                                    className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white/5 file:text-zinc-300 hover:file:bg-white/10 transition-colors cursor-pointer disabled:opacity-50" 
                                />
                            </label>
                        </div>
                    </div>

                    {/* Text Inputs */}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-300 mb-2">Title</label>
                            <input 
                                {...register("title", { required: true })} 
                                disabled={loading}
                                className="w-full px-4 py-3 bg-[#09090b]/50 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-zinc-100 placeholder:text-zinc-600 text-sm shadow-inner disabled:opacity-50" 
                                placeholder="Give your video a catchy title" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-zinc-300 mb-2">Description</label>
                            <textarea 
                                {...register("description", { required: true })} 
                                rows="5" 
                                disabled={loading}
                                className="w-full px-4 py-3 bg-[#09090b]/50 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-zinc-100 placeholder:text-zinc-600 text-sm resize-none custom-scrollbar shadow-inner disabled:opacity-50" 
                                placeholder="Tell viewers about your video..." 
                            />
                        </div>
                    </div>

                    {/* --- PROGRESS BAR UI --- */}
                    {loading && (
                        <div className="pt-2 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-zinc-300">
                                    {isProcessing ? 'Processing video qualities...' : 'Uploading to server...'}
                                </span>
                                <span className="text-indigo-400">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5">
                                <div 
                                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300 ease-out relative"
                                    style={{ width: `${uploadProgress}%` }}
                                >
                                    {/* Shimmer effect inside the bar */}
                                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                            {isProcessing && (
                                <p className="text-xs text-zinc-500 mt-3 animate-pulse">
                                    Hang tight! This step might take a few minutes depending on the video size.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Submit Area */}
                    <div className="pt-6 border-t border-white/5 flex items-center justify-end gap-4">
                        <button 
                            type="button"
                            onClick={() => reset()}
                            disabled={loading}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={loading} 
                            type="submit" 
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px] shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-95 border border-white/10"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Uploading...
                                </span>
                            ) : (
                                "Publish Video"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UploadVideo;