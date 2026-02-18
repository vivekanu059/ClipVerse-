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
        
        // Append text fields
        formData.append("fullName", data.fullName)
        formData.append("username", data.username)
        formData.append("email", data.email)
        formData.append("password", data.password)
        
        // Append files
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
            toast.success("Account created! Please login.")
            navigate("/login")
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white py-10">
            <div className="w-full max-w-lg p-8 bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-700">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-purple-500">VideoTube</h1>
                    <p className="text-gray-400">Create a new account</p>
                </div>

                <form onSubmit={handleSubmit(createAccount)} className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="text-sm text-gray-400">Full Name</label>
                        <input {...register("fullName", { required: true })} className="w-full px-4 py-2 bg-black border border-gray-600 rounded focus:border-purple-500 outline-none" />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="text-sm text-gray-400">Username</label>
                        <input {...register("username", { required: true })} className="w-full px-4 py-2 bg-black border border-gray-600 rounded focus:border-purple-500 outline-none" />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-sm text-gray-400">Email</label>
                        <input type="email" {...register("email", { required: true })} className="w-full px-4 py-2 bg-black border border-gray-600 rounded focus:border-purple-500 outline-none" />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-sm text-gray-400">Password</label>
                        <input type="password" {...register("password", { required: true })} className="w-full px-4 py-2 bg-black border border-gray-600 rounded focus:border-purple-500 outline-none" />
                    </div>

                    {/* Avatar Upload */}
                    <div>
                        <label className="text-sm text-gray-400">Avatar (Required)</label>
                        <input type="file" accept="image/*" {...register("avatar", { required: true })} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-purple-600 file:text-white file:border-0" />
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                        <label className="text-sm text-gray-400">Cover Image (Optional)</label>
                        <input type="file" accept="image/*" {...register("coverImage")} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-gray-600 file:text-white file:border-0" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-2 mt-4 bg-purple-600 hover:bg-purple-700 rounded font-bold">
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-4">
                    Already have an account? <Link to="/login" className="text-purple-400 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    )
}

export default Signup