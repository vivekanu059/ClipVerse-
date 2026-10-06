import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';
import { FiEye, FiEyeOff, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { login } from '../store/authSlice';
import axiosInstance from '../utils/axiosInstance';
import Logo from '../components/Logo';
import BrandPanel from '../components/BrandPanel';

function Signup() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const avatarFile = watch('avatar')?.[0];

    useEffect(() => {
        if (!avatarFile) return setAvatarUrl(null);
        const url = URL.createObjectURL(avatarFile);
        setAvatarUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axiosInstance.post('/users/google-auth', { credential: credentialResponse.credential });
            dispatch(login(res.data.data));
            toast.success('Welcome to ClipVerse');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || "Couldn't sign in with Google. Try again.");
        }
    };

    const createAccount = async (data) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('fullName', data.fullName);
        formData.append('username', data.username);
        formData.append('email', data.email);
        formData.append('password', data.password);
        if (data.avatar?.[0]) formData.append('avatar', data.avatar[0]);
        if (data.coverImage?.[0]) formData.append('coverImage', data.coverImage[0]);
        try {
            await axiosInstance.post('/users/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Account created. Log in to continue.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || "Couldn't create your account. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const field = (bad) => `w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 transition placeholder:text-zinc-600 focus:ring-2 ${bad ? 'ring-red-500/60 focus:ring-red-500' : 'ring-white/10 focus:ring-amber-400'}`;
    const label = 'mb-1.5 block text-sm font-medium text-zinc-300';
    const err = (e) => e && <p className="mt-1.5 text-xs text-red-400">{e.message}</p>;

    return (
        <div className="flex min-h-screen bg-[#0a0a0c] font-['DM_Sans',sans-serif] text-zinc-100">
            <BrandPanel title="Start your channel in a minute." text="Add a name, a photo and your first upload. ClipVerse handles transcoding and streaming for you." />

            <div className="flex w-full justify-center px-6 py-12 lg:w-1/2 lg:items-center">
                <div className="w-full max-w-sm">
                    <div className="mb-10 lg:hidden"><Logo size="h-7 w-7" /></div>
                    <h1 className="font-['Bricolage_Grotesque',sans-serif] text-3xl font-extrabold tracking-tight text-white">Create your account</h1>
                    <p className="mt-2 text-sm text-zinc-400">Free to join. Upload as soon as you're in.</p>

                    <div className="mt-8 flex justify-center">
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google sign-in was closed or failed')}
                            theme="filled_black" shape="rectangular" text="signup_with" width="384" />
                    </div>

                    <div className="my-6 flex items-center gap-3 text-xs text-zinc-600">
                        <span className="h-px flex-1 bg-white/10" />or use email<span className="h-px flex-1 bg-white/10" />
                    </div>

                    <form onSubmit={handleSubmit(createAccount)} className="space-y-5" noValidate>
                        <div className="flex items-center gap-4">
                            <label className="group relative grid h-20 w-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10 transition hover:ring-amber-400 focus-within:ring-2 focus-within:ring-amber-400">
                                {avatarUrl ? <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" /> : <FiCamera className="text-xl text-zinc-500 group-hover:text-amber-400" />}
                                <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0"
                                    {...register('avatar', { required: 'Add a profile photo' })} />
                            </label>
                            <div>
                                <p className="text-sm font-medium text-zinc-200">Profile photo</p>
                                <p className="text-xs text-zinc-500">Required. Square images look best.</p>
                                {err(errors.avatar)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="fn" className={label}>Full name</label>
                                <input id="fn" autoComplete="name" placeholder="Asha Rao" className={field(errors.fullName)} {...register('fullName', { required: 'Enter your name' })} />
                                {err(errors.fullName)}
                            </div>
                            <div>
                                <label htmlFor="un" className={label}>Username</label>
                                <input id="un" autoComplete="username" placeholder="asharao" className={field(errors.username)} {...register('username', { required: 'Pick a username' })} />
                                {err(errors.username)}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="em" className={label}>Email</label>
                            <input id="em" type="email" autoComplete="email" placeholder="you@example.com" className={field(errors.email)}
                                {...register('email', { required: 'Enter your email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })} />
                            {err(errors.email)}
                        </div>

                        <div>
                            <label htmlFor="pw" className={label}>Password</label>
                            <div className="relative">
                                <input id="pw" type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" className={`${field(errors.password)} pr-11`}
                                    {...register('password', { required: 'Choose a password', minLength: { value: 8, message: 'Use at least 8 characters' } })} />
                                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white">
                                    {show ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {err(errors.password)}
                        </div>

                        <div>
                            <label htmlFor="cv" className={label}>Cover image <span className="font-normal text-zinc-500">(optional)</span></label>
                            <input id="cv" type="file" accept="image/*" {...register('coverImage')}
                                className="block w-full cursor-pointer rounded-xl bg-white/5 text-sm text-zinc-400 ring-1 ring-white/10 file:mr-3 file:cursor-pointer file:border-0 file:bg-white/10 file:px-4 file:py-3 file:text-sm file:font-medium file:text-white hover:file:bg-white/15" />
                        </div>

                        <button type="submit" disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-black transition hover:bg-amber-300 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60">
                            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />}
                            {loading ? 'Creating account' : 'Create account'}
                        </button>
                    </form>

                    <p className="mt-8 text-sm text-zinc-400">Already have an account? <Link to="/login" className="font-semibold text-white hover:text-amber-300">Log in</Link></p>
                </div>
            </div>
        </div>
    );
}
export default Signup;