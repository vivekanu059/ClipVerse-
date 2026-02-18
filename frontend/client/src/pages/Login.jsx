import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { getCurrentUser } from '../store/authSlice' // We use this to update state after login
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
        // Check if the input is an email or a username
        const isEmail = data.email.includes("@");
        
        const payload = {
            password: data.password,
            // If it has '@', send as email. Otherwise, send as username.
            ...(isEmail ? { email: data.email } : { username: data.email })
        };

        await axiosInstance.post("/users/login", payload);
            // 1. Send credentials to backend
            await axiosInstance.post("/users/login", data)
            
            // 2. If successful, fetch the user data to update Redux store
            // (The cookies are set automatically by the backend)
            const user = await dispatch(getCurrentUser())
            
            if (user.payload) {
                toast.success("Logged in successfully")
                navigate("/") // Redirect to Home
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-700">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-purple-500">VideoTube</h1>
                    <p className="mt-2 text-gray-400">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit(login)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email or Username</label>
                        <input 
                            type="text"
                            className="w-full px-4 py-2 bg-[#000] border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
                            placeholder="Enter email or username"
                            {...register("email", { required: true })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input 
                            type="password"
                            className="w-full px-4 py-2 bg-[#000] border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
                            placeholder="Enter password"
                            {...register("password", { required: true })}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition duration-200"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-purple-400 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login