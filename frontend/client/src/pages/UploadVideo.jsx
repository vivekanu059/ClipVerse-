import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { FiUploadCloud } from 'react-icons/fi';

function UploadVideo() {
    const { register, handleSubmit, reset } = useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("videoFile", data.videoFile[0]);
        formData.append("thumbnail", data.thumbnail[0]);

        try {
            await axiosInstance.post("/videos/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("Video uploaded! It is being processed.");
            reset();
        } catch (error) {
            toast.error(error.response?.data?.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-[#1e1e1e] rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><FiUploadCloud className="text-purple-500"/> Upload Video</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* File Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="border border-dashed border-gray-600 p-4 rounded text-center cursor-pointer hover:bg-[#2d2d2d]">
                        <label className="cursor-pointer">
                            <span className="block mb-2 text-sm text-gray-400">Video File</span>
                            <input type="file" accept="video/*" {...register("videoFile", { required: true })} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-600 file:text-white" />
                        </label>
                    </div>
                    <div className="border border-dashed border-gray-600 p-4 rounded text-center hover:bg-[#2d2d2d]">
                        <label className="cursor-pointer">
                            <span className="block mb-2 text-sm text-gray-400">Thumbnail</span>
                            <input type="file" accept="image/*" {...register("thumbnail", { required: true })} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-600 file:text-white" />
                        </label>
                    </div>
                </div>

                {/* Text Inputs */}
                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input {...register("title", { required: true })} className="w-full bg-transparent border border-gray-600 rounded p-2 focus:border-purple-500 outline-none" placeholder="Video Title" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea {...register("description", { required: true })} rows="4" className="w-full bg-transparent border border-gray-600 rounded p-2 focus:border-purple-500 outline-none" placeholder="Tell viewers about your video" />
                </div>

                <button disabled={loading} type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition">
                    {loading ? "Uploading..." : "Publish Video"}
                </button>
            </form>
        </div>
    );
}
export default UploadVideo;