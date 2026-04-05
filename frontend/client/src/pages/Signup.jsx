import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux' 
import { GoogleLogin } from '@react-oauth/google' 
import { login } from '../store/authSlice' 
import axiosInstance from '../utils/axiosInstance'
import toast from 'react-hot-toast'

function Signup() {
    const navigate = useNavigate()
    const dispatch = useDispatch() 
    const { register, handleSubmit } = useForm()
    const [loading, setLoading] = useState(false)

    // --- NEW: Google Authentication Handler ---
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axiosInstance.post('/users/google-auth', {
                credential: credentialResponse.credential
            });
            dispatch(login(res.data.data));
            toast.success("Welcome to ClipVerse!");
            navigate('/'); 
        } catch (error) {
            console.error("Google Auth Failed:", error);
            toast.error(error.response?.data?.message || "Failed to authenticate with Google.");
        }
    };

    // --- EXISTING: Traditional Registration Handler ---
    const createAccount = async (data) => {
        setLoading(true)
        const formData = new FormData()
        
        formData.append("fullName", data.fullName)
        formData.append("username", data.username)
        formData.append("email", data.email)
        formData.append("password", data.password)
        
        if (data.avatar[0]) {
            formData.append("avatar", data.avatar[0])
        }
        if (data.coverImage && data.coverImage[0]) {
            formData.append("coverImage", data.coverImage[0])
        }

        try {
            await axiosInstance.post("/users/register", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            toast.success("Account created! Please log in.")
            navigate("/login")
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen w-full flex bg-[#000000] text-neutral-100 font-sans overflow-hidden">
            
            {/* Left Side: Branding / Visual */}
            <div className="hidden lg:flex w-1/2 bg-[#0a0a0a] border-r border-neutral-900 p-10 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-neutral-800/10 to-transparent pointer-events-none z-0"></div>
                
                {/* Animated Cinematic Rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="absolute w-[450px] h-[450px] border border-neutral-800/60 rounded-full animate-[spin_60s_linear_infinite]"></div>
                    <div className="absolute w-[320px] h-[320px] border border-neutral-700/40 rounded-full border-dashed animate-[spin_40s_linear_infinite_reverse]"></div>
                    <div className="absolute w-[200px] h-[200px] border border-neutral-600/30 rounded-full animate-[spin_20s_linear_infinite]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-neutral-600/50"></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-0.5 h-4 bg-neutral-600/50"></div>
                        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-0.5 bg-neutral-600/50"></div>
                        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-0.5 bg-neutral-600/50"></div>
                    </div>
                </div>

                {/* Logo Area */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                            <polygon points="12 2 2 22 12 17 22 22 12 2" fill="currentColor" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">ClipVerse</span>
                </div>

                {/* Elegant Quote */}
                <div className="relative z-10 max-w-md pb-8">
                    <blockquote className="text-2xl font-medium tracking-tight text-neutral-200 leading-snug">
                        "The most elegant way to host, share, and manage your high-quality videos."
                    </blockquote>
                    <p className="mt-4 text-sm text-neutral-500 font-medium">
                        — ClipVerse for Professionals
                    </p>
                </div>
            </div>

            {/* Right Side: Authentication Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-black relative overflow-y-auto z-10 custom-scrollbar">
                
                {/* Mobile Logo */}
                <div className="absolute top-6 left-6 flex lg:hidden items-center gap-2">
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                            <polygon points="12 2 2 22 12 17 22 22 12 2" fill="currentColor" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white">VideoTube</span>
                </div>

                {/* Form Container */}
                <div className="w-full max-w-[380px] space-y-6 my-auto pt-10 lg:pt-0">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Create an account
                        </h1>
                        <p className="text-neutral-400 mt-1.5 text-sm">
                            Join VideoTube to start sharing your content.
                        </p>
                    </div>

                    {/* NEW: Replaced the static button with the functional GoogleLogin component */}
                    <div className="flex justify-center w-full">
                        <GoogleLogin 
                            onSuccess={handleGoogleSuccess}
                            onError={() => toast.error("Google Login popup closed or failed")}
                            theme="filled_black" 
                            shape="rectangular"
                            text="signup_with"
                            width="380"
                        />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 py-1">
                        <div className="h-px w-full bg-neutral-800"></div>
                        <span className="text-[11px] font-medium text-neutral-600 uppercase tracking-widest">Or</span>
                        <div className="h-px w-full bg-neutral-800"></div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(createAccount)} className="space-y-4">
                        
                        {/* 2-Column Grid for Name & Username */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-neutral-300">
                                    Full Name
                                </label>
                                <input 
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#111111] border border-neutral-800 rounded-md focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder:text-neutral-600 text-white text-sm"
                                    placeholder="John Doe"
                                    {...register("fullName", { required: true })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-neutral-300">
                                    Username
                                </label>
                                <input 
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#111111] border border-neutral-800 rounded-md focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder:text-neutral-600 text-white text-sm"
                                    placeholder="johndoe"
                                    {...register("username", { required: true })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-neutral-300">
                                Email
                            </label>
                            <input 
                                type="email"
                                className="w-full px-3 py-2 bg-[#111111] border border-neutral-800 rounded-md focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder:text-neutral-600 text-white text-sm"
                                placeholder="name@example.com"
                                {...register("email", { required: true })}
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-neutral-300">
                                Password
                            </label>
                            <input 
                                type="password"
                                className="w-full px-3 py-2 bg-[#111111] border border-neutral-800 rounded-md focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder:text-neutral-600 text-white text-sm"
                                placeholder="••••••••"
                                {...register("password", { required: true })}
                            />
                        </div>

                        {/* File Uploads */}
                        <div className="space-y-3 pt-1">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                                    Avatar <span className="text-neutral-500 font-normal">(Required)</span>
                                </label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    {...register("avatar", { required: true })} 
                                    className="block w-full text-sm text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 transition-colors bg-[#111111] border border-neutral-800 rounded-md cursor-pointer" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                                    Cover Image <span className="text-neutral-500 font-normal">(Optional)</span>
                                </label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    {...register("coverImage")} 
                                    className="block w-full text-sm text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 transition-colors bg-[#111111] border border-neutral-800 rounded-md cursor-pointer" 
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-2.5 mt-4 bg-white hover:bg-neutral-200 text-black rounded-md font-bold text-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                "Sign up"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="pt-2 text-left pb-6 lg:pb-0">
                        <p className="text-sm text-neutral-400">
                            Already have an account?{" "}
                            <Link to="/login" className="font-semibold text-white hover:underline transition-all">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Signup