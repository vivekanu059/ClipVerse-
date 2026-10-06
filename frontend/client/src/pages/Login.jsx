import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Logo from '../components/Logo';
import BrandPanel from '../components/BrandPanel';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../store/authSlice';
import axiosInstance from '../utils/axiosInstance';

function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);

    const login = async (data) => {
        setLoading(true);
        try {
            const id = data.email.trim();
            await axiosInstance.post('/users/login', { password: data.password, ...(id.includes('@') ? { email: id } : { username: id }) });
            const user = await dispatch(getCurrentUser());
            if (user.payload) {
                toast.success('Welcome back');
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Couldn't log you in. Check your details.");
        } finally {
            setLoading(false);
        }
    };

    const field = (bad) => `w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 transition placeholder:text-zinc-600 focus:ring-2 ${bad ? 'ring-red-500/60 focus:ring-red-500' : 'ring-white/10 focus:ring-amber-400'}`;

    return (
        <div className="flex min-h-screen bg-[#0a0a0c] font-['DM_Sans',sans-serif] text-zinc-100">
            <BrandPanel title="Your videos deserve a better stage." text="Upload once, stream in HLS at any quality, and keep every view, subscriber and upload in one place." />

            <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
                <div className="w-full max-w-sm">
                    <div className="mb-10 lg:hidden"><Logo size="h-7 w-7" /></div>
                    <h1 className="font-['Bricolage_Grotesque',sans-serif] text-3xl font-extrabold tracking-tight text-white">Log in</h1>
                    <p className="mt-2 text-sm text-zinc-400">Pick up where you left off.</p>

                    <form onSubmit={handleSubmit(login)} className="mt-8 space-y-5" noValidate>
                        <div>
                            <label htmlFor="id" className="mb-1.5 block text-sm font-medium text-zinc-300">Email or username</label>
                            <input id="id" autoComplete="username" placeholder="you@example.com" className={field(errors.email)}
                                {...register('email', { required: 'Enter your email or username' })} />
                            {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
                        </div>
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label htmlFor="pw" className="text-sm font-medium text-zinc-300">Password</label>
                                <Link to="/forgot-password" className="text-xs text-zinc-500 hover:text-amber-300">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <input id="pw" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" className={`${field(errors.password)} pr-11`}
                                    {...register('password', { required: 'Enter your password' })} />
                                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white">
                                    {show ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
                        </div>
                        <button type="submit" disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-black transition hover:bg-amber-300 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60">
                            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />}
                            {loading ? 'Logging in' : 'Log in'}
                        </button>
                    </form>

                    <p className="mt-8 text-sm text-zinc-400">
                        New to ClipVerse? <Link to="/signup" className="font-semibold text-white hover:text-amber-300">Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
export default Login;