import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axiosInstance from '../utils/axiosInstance'
import toast from 'react-hot-toast'

function Signup() {
    const navigate = useNavigate()
    const { register, handleSubmit } = useForm()
    const [loading, setLoading] = useState(false)

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
        if (data.coverImage[0]) {
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
            
            {/* Left Side: Branding / Visual (Identical to Login) */}
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

                    {/* Social Logins */}
                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-center gap-3 py-2 bg-[#111111] hover:bg-[#1a1a1a] border border-neutral-800 rounded-md text-sm font-semibold transition-colors">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Sign up with Google
                        </button>
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