import React, { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser, getCurrentUser } from "./store/authSlice"; 
import { 
    FiUpload, FiLogOut, FiMenu, FiUser, FiHome, FiThumbsUp 
} from "react-icons/fi";
 // Optional: makes conditional classes cleaner, or use template literals

function Layout() {
    const { status, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    
    // State for Mobile Sidebar
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Restore session on page load
    useEffect(() => {
        dispatch(getCurrentUser());
    }, [dispatch]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate("/login");
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#121212] text-white font-sans">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-[#121212] border-b border-gray-800 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Toggle */}
                    <button onClick={toggleMobileMenu} className="sm:hidden text-2xl focus:outline-none">
                        <FiMenu />
                    </button>
                    
                    <Link to="/" className="text-xl font-bold text-purple-500 flex items-center gap-1">
                        VideoTube
                    </Link>
                </div>

                <div className="flex items-center gap-6">
                    {/* Search bar placeholder - Hidden on small screens for now */}
                    <div className="hidden md:block w-96">
                        <input 
                            type="text" 
                            placeholder="Search" 
                            className="w-full bg-[#121212] border border-gray-700 rounded-full px-4 py-1.5 focus:border-purple-500 outline-none text-sm"
                        />
                    </div>

                    {status ? (
                        <>
                            <Link to="/upload" className="flex items-center gap-2 hover:text-purple-400 transition">
                                <FiUpload className="text-xl"/> 
                                <span className="hidden sm:inline font-medium">Upload</span>
                            </Link>
                            
                            {/* Profile Dropdown */}
                            <div className="relative group cursor-pointer z-50">
                                <img 
                                    src={user?.avatar} 
                                    alt="avatar" 
                                    className="w-9 h-9 rounded-full object-cover border border-gray-600 hover:border-purple-500 transition"
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-xl hidden group-hover:block overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-700 bg-[#252525]">
                                        <p className="text-sm text-white font-semibold truncate">{user?.fullName}</p>
                                        <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
                                    </div>
                                    <Link to={`/c/${user?.username}`} className="block px-4 py-2 text-sm hover:bg-gray-700 transition">
                                        My Channel
                                    </Link>
                                    <Link to="/dashboard" className="block px-4 py-2 text-sm hover:bg-gray-700 transition">
                                        Dashboard
                                    </Link>
                                    <button 
                                        onClick={handleLogout} 
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-red-400 flex items-center gap-2 transition border-t border-gray-700"
                                    >
                                        <FiLogOut /> Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-4 items-center">
                            <Link to="/login" className="text-white hover:text-purple-400 font-medium transition">Login</Link>
                            <Link to="/signup" className="bg-purple-600 px-5 py-1.5 rounded-full text-white font-medium hover:bg-purple-700 transition shadow-lg shadow-purple-900/20">Signup</Link>
                        </div>
                    )}
                </div>
            </header>

            {/* Layout Container */}
            <div className="flex pt-16 h-screen overflow-hidden">
                {/* Sidebar - Desktop & Mobile */}
                <aside className={`
                    fixed sm:static top-16 left-0 h-full w-64 bg-[#121212] border-r border-gray-800 
                    transform transition-transform duration-300 z-40 overflow-y-auto pb-20
                    ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
                `}>
                    <div className="p-4 space-y-2">
                        <SidebarItem 
                            to="/" 
                            icon={<FiHome />} 
                            label="Home" 
                            isActive={location.pathname === "/"} 
                        />
                        <SidebarItem 
                            to="/history" 
                            icon={<FiUser />} 
                            label="History" 
                            isActive={location.pathname === "/history"} 
                        />
                        <SidebarItem 
                            to="/liked-videos" 
                            icon={<FiThumbsUp />} 
                            label="Liked Videos" 
                            isActive={location.pathname === "/liked-videos"} 
                        />
                        {/* You can add more items like Subscriptions here */}
                    </div>
                </aside>

                {/* Overlay for mobile when menu is open */}
                {mobileMenuOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    ></div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 p-6 overflow-y-auto w-full bg-[#121212] scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

// Improved Sidebar Item Component with Active State
const SidebarItem = ({ to, icon, label, isActive }) => (
    <Link 
        to={to} 
        className={`flex items-center gap-4 px-4 py-3 rounded-lg transition duration-200 
        ${isActive 
            ? "bg-purple-600 text-white font-medium" 
            : "text-gray-300 hover:bg-[#2d2d2d] hover:text-white"
        }`}
    >
        <span className="text-xl">{icon}</span>
        <span>{label}</span>
    </Link>
);

export default Layout;