import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { getCurrentUser } from '../store/authSlice'
import axiosInstance from '../utils/axiosInstance'
import toast from 'react-hot-toast'

function Login() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { register, handleSubmit } = useForm()
    const [loading, setLoading] = useState(false)

    const login = async (data) => {
        setLoading(true);
        try {
            const isEmail = data.email.includes("@");
            const payload = {
                password: data.password,
                ...(isEmail ? { email: data.email } : { username: data.email })
            };

            await axiosInstance.post("/users/login", payload);
            const user = await dispatch(getCurrentUser())
            
            if (user.payload) {
                toast.success("Logged in successfully")
                navigate("/") 
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen w-full flex bg-[#000000] text-neutral-100 font-sans overflow-hidden">
            
            {/* Left Side: Branding / Visual */}
            <div className="hidden lg:flex w-1/2 bg-[#0a0a0a] border-r border-neutral-900 p-10 flex-col justify-between relative overflow-hidden">
                {/* Subtle corner gradient */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-neutral-800/10 to-transparent pointer-events-none z-0"></div>
                
                {/* Animated Cinematic Rings (Fills the vacant space) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    {/* Outer slow-rotating ring */}
                    <div className="absolute w-[450px] h-[450px] border border-neutral-800/60 rounded-full animate-[spin_60s_linear_infinite]"></div>
                    
                    {/* Middle dashed ring rotating in reverse */}
                    <div className="absolute w-[320px] h-[320px] border border-neutral-700/40 rounded-full border-dashed animate-[spin_40s_linear_infinite_reverse]"></div>
                    
                    {/* Inner focus ring */}
                    <div className="absolute w-[200px] h-[200px] border border-neutral-600/30 rounded-full animate-[spin_20s_linear_infinite]">
                        {/* Camera crosshairs */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-neutral-600/50"></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-0.5 h-4 bg-neutral-600/50"></div>
                        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-0.5 bg-neutral-600/50"></div>
                        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-0.5 bg-neutral-600/50"></div>
                    </div>
                </div>

                {/* Logo Area */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                        {/* New geometric, modern logo */}
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
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-black relative overflow-y-auto z-10">
                
                {/* Mobile Logo */}
                <div className="absolute top-6 left-6 flex lg:hidden items-center gap-2">
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                            <polygon points="12 2 2 22 12 17 22 22 12 2" fill="currentColor" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white">ClipVerse</span>
                </div>

                {/* Form Container */}
                <div className="w-full max-w-[360px] space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Log in
                        </h1>
                        <p className="text-neutral-400 mt-1.5 text-sm">
                            Welcome back. Enter your details to access your account.
                        </p>
                    </div>

                    {/* Social Logins */}
                    

                    {/* Divider */}
                    <div className="flex items-center gap-3 py-1">
                        <div className="h-px w-full bg-neutral-800"></div>
                        <span className="text-[11px] font-medium text-neutral-600 uppercase tracking-widest"></span>
                        <div className="h-px w-full bg-neutral-800"></div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(login)} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-neutral-300">
                                Email or Username
                            </label>
                            <input 
                                type="text"
                                className="w-full px-3 py-2 bg-[#111111] border border-neutral-800 rounded-md focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder:text-neutral-600 text-white text-sm"
                                placeholder="Enter email or username"
                                {...register("email", { required: true })}
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-neutral-300">
                                    Password
                                </label>
                                <a href="#" className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                            <input 
                                type="password"
                                className="w-full px-3 py-2 bg-[#111111] border border-neutral-800 rounded-md focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder:text-neutral-600 text-white text-sm"
                                placeholder="••••••••"
                                {...register("password", { required: true })}
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-2.5 mt-2 bg-white hover:bg-neutral-200 text-black rounded-md font-bold text-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Logging in...
                                </span>
                            ) : (
                                "Log in"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="pt-2 text-left">
                        <p className="text-sm text-neutral-400">
                            Don't have an account?{" "}
                            <Link to="/signup" className="font-semibold text-white hover:underline transition-all">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login