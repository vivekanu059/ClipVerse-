import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiVideo, FiImage, FiCheck } from 'react-icons/fi';
import axiosInstance from '../utils/axiosInstance';

const mb = (f) => `${(f.size / 1048576).toFixed(1)} MB`;

// Reads the real duration (seconds) from the chosen file's metadata; resolves 0 if it can't
const getVideoDuration = (file) => new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement('video');
    const done = (d) => { URL.revokeObjectURL(url); resolve(Number.isFinite(d) ? Math.round(d) : 0); };
    el.preload = 'metadata';
    el.onloadedmetadata = () => done(el.duration);
    el.onerror = () => done(0);
    el.src = url;
});

function DropZone({ icon, title, hint, accept, disabled, error, file, previewUrl, inputProps }) {
    return (
        <div>
            <div className={`group relative flex min-h-[11rem] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed p-6 text-center transition focus-within:ring-2 focus-within:ring-amber-400 ${error ? 'border-red-500/60' : file ? 'border-amber-400/50 bg-amber-400/[0.04]' : 'border-white/15 hover:border-amber-400/60 hover:bg-white/[0.03]'}`}>
                {previewUrl && <img src={previewUrl} alt="Thumbnail preview" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
                <div className="relative">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/5 text-xl text-amber-400 ring-1 ring-white/10 transition group-hover:scale-110">
                        {file ? <FiCheck /> : icon}
                    </span>
                    <p className="mt-3 text-sm font-semibold text-white">{file ? file.name : title}</p>
                    <p className="mt-1 text-xs text-zinc-400">{file ? `${mb(file)}. Click to replace.` : hint}</p>
                </div>
                <input type="file" accept={accept} disabled={disabled} className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed" {...inputProps} />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-400">{error.message}</p>}
        </div>
    );
}

function UploadVideo() {
    const navigate = useNavigate();
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [thumbUrl, setThumbUrl] = useState(null);

    const videoFile = watch('videoFile')?.[0];
    const thumbFile = watch('thumbnail')?.[0];

    useEffect(() => {
        if (!thumbFile) return setThumbUrl(null);
        const url = URL.createObjectURL(thumbFile);
        setThumbUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [thumbFile]);

    const onSubmit = async (data) => {
        setLoading(true);
        setProgress(0);
        setProcessing(false);
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('videoFile', data.videoFile[0]);
        const duration = await getVideoDuration(data.videoFile[0]);
        if (duration > 0) formData.append('duration', duration);
        formData.append('thumbnail', data.thumbnail[0]);
        try {
            await axiosInstance.post('/videos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (!e.total) return;
                    const pct = Math.round((e.loaded * 100) / e.total);
                    setProgress(pct);
                    if (pct === 100) setProcessing(true); // upload done, server is transcoding
                },
            });
            toast.success('Upload complete. Processing has started.');
            reset();
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed. Try again.');
            setProgress(0);
            setProcessing(false);
        } finally {
            setLoading(false);
        }
    };

    const input = (bad) => `w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 transition placeholder:text-zinc-600 focus:ring-2 disabled:opacity-50 ${bad ? 'ring-red-500/60 focus:ring-red-500' : 'ring-white/10 focus:ring-amber-400'}`;

    return (
        <div className="min-h-screen bg-[#0a0a0c] px-4 py-10 font-['DM_Sans',sans-serif] text-zinc-100 sm:px-8">
            <div className="mx-auto max-w-3xl">
                <h1 className="font-['Bricolage_Grotesque',sans-serif] text-3xl font-extrabold tracking-tight text-white">Upload a video</h1>
                <p className="mt-2 text-sm text-zinc-400">Add your video and a thumbnail, then give it a title viewers will click.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
                    <div className="grid gap-5 md:grid-cols-2">
                        <DropZone icon={<FiVideo />} title="Choose a video" hint="Drop a file here or click. MP4, WebM or OGG." accept="video/*"
                            disabled={loading} file={videoFile} error={errors.videoFile} inputProps={register('videoFile', { required: 'Choose a video file' })} />
                        <DropZone icon={<FiImage />} title="Choose a thumbnail" hint="JPG, PNG or WEBP. 16:9 works best." accept="image/*"
                            disabled={loading} file={thumbFile} previewUrl={thumbUrl} error={errors.thumbnail} inputProps={register('thumbnail', { required: 'Choose a thumbnail' })} />
                    </div>

                    <div>
                        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-zinc-300">Title</label>
                        <input id="title" disabled={loading} placeholder="What is this video about?" className={input(errors.title)} {...register('title', { required: 'Add a title' })} />
                        {errors.title && <p className="mt-1.5 text-xs text-red-400">{errors.title.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="desc" className="mb-1.5 block text-sm font-medium text-zinc-300">Description</label>
                        <textarea id="desc" rows={5} disabled={loading} placeholder="Add details, credits or links" className={`${input(errors.description)} resize-none`} {...register('description', { required: 'Add a description' })} />
                        {errors.description && <p className="mt-1.5 text-xs text-red-400">{errors.description.message}</p>}
                    </div>

                    {loading && (
                        <div role="status" className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/5">
                            <div className="mb-2 flex justify-between text-sm font-medium">
                                <span className="text-zinc-200">{processing ? 'Processing your video' : 'Uploading'}</span>
                                <span className="tabular-nums text-amber-400">{progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div className={`h-full rounded-full bg-amber-400 transition-[width] duration-300 ${processing ? 'animate-pulse' : ''}`} style={{ width: `${progress}%` }} />
                            </div>
                            {processing && <p className="mt-3 text-xs text-zinc-500">Transcoding into multiple qualities. This can take a few minutes for long videos.</p>}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
                        <button type="button" onClick={() => reset()} disabled={loading} className="rounded-xl px-5 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50">Clear form</button>
                        <button type="submit" disabled={loading} className="flex min-w-[10rem] items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-black transition hover:bg-amber-300 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60">
                            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />}
                            {loading ? 'Uploading' : 'Publish video'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default UploadVideo;