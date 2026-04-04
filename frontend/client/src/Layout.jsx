import React, { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser, getCurrentUser } from "./store/authSlice"; 
import { 
    FiUpload, FiLogOut, FiMenu, FiUser, FiHome, FiThumbsUp, FiSearch, FiSettings 
} from "react-icons/fi";

function Layout() {
    const { status, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    // 1. Added State for the Search Query
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        dispatch(getCurrentUser());
    }, [dispatch]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate("/login");
    };

    // 2. Added Search Handler
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search/${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#000000] text-neutral-100 font-sans overflow-hidden selection:bg-neutral-800">
            
            {/* Top Navigation Bar */}
            <header className="fixed top-0 w-full z-50 bg-[#000000]/80 backdrop-blur-lg border-b border-neutral-900 px-4 sm:px-6 h-16 flex justify-between items-center">
                
                <div className="flex items-center gap-5">
                    {/* Mobile Menu Toggle */}
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden text-xl text-neutral-400 hover:text-white transition-colors focus:outline-none">
                        <FiMenu />
                    </button>
                    
                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-7 h-7 bg-white rounded flex items-center justify-center transform group-hover:scale-105 transition-transform">
                            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                                <polygon points="12 2 2 22 12 17 22 22 12 2" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white hidden sm:block">
                            ClipVerse
                        </span>
                    </Link>
                </div>

                {/* Central Search */}
                <div className="hidden md:flex flex-1 max-w-md mx-6">
                    {/* 3. Changed this div to a form to capture 'Enter' key presses */}
                    <form onSubmit={handleSearch} className="relative w-full group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-white transition-colors">
                            <FiSearch />
                        </div>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search videos, creators, and channels" 
                            className="w-full bg-[#111111] border border-neutral-800 rounded-md pl-10 pr-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:bg-[#1a1a1a] focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600 transition-all"
                        />
                    </form>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4 sm:gap-6">
                    {status ? (
                        <>
                            {/* High-Contrast Upload Button */}
                            <Link to="/upload" className="hidden sm:flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-neutral-200 transition-colors active:scale-95">
                                <FiUpload className="text-base" strokeWidth={2.5} /> 
                                <span>New Video</span>
                            </Link>
                            
                            {/* Mobile Upload Icon */}
                            <Link to="/upload" className="sm:hidden text-neutral-400 hover:text-white transition-colors">
                                <FiUpload className="text-xl" />
                            </Link>

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                                    className="block rounded-full focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black transition-all"
                                >
                                    <img 
                                        src={user?.avatar} 
                                        alt="avatar" 
                                        className="w-8 h-8 rounded-full object-cover bg-neutral-900 border border-neutral-800"
                                    />
                                </button>
                                
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-[#0a0a0a] border border-neutral-800 rounded-md shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-neutral-800 mb-1">
                                            <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
                                            <p className="text-xs text-neutral-500 truncate mt-0.5">@{user?.username}</p>
                                        </div>
                                        <Link to={`/c/${user?.username}`} className="block px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-[#111111] transition-colors">
                                            My Channel
                                        </Link>
                                        <Link to="/dashboard" className="block px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-[#111111] transition-colors">
                                            Dashboard
                                        </Link>
                                        <div className="h-px bg-neutral-800 my-1"></div>
                                        <button 
                                            onClick={handleLogout} 
                                            className="w-full text-left px-4 py-2 text-sm text-neutral-400 hover:text-white hover:bg-[#111111] flex items-center gap-2 transition-colors"
                                        >
                                            <FiLogOut /> Log out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-4 items-center pl-2">
                            <Link to="/login" className="text-sm text-neutral-400 hover:text-white font-medium transition-colors">Log in</Link>
                            <Link to="/signup" className="bg-white text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-neutral-200 transition-colors">Join</Link>
                        </div>
                    )}
                </div>
            </header>

            {/* Layout Container */}
            <div className="flex pt-16 h-full w-full">
                
                {/* Sidebar */}
                <aside className={`
                    fixed sm:static top-16 left-0 h-[calc(100vh-4rem)] w-60 bg-[#0a0a0a] border-r border-neutral-900 
                    transform transition-transform duration-300 ease-in-out z-40 shrink-0 flex flex-col
                    ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
                `}>
                    <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                        <div className="px-3 mb-2">
                            <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Menu</h3>
                        </div>
                        <SidebarItem to="/" icon={<FiHome />} label="Home" isActive={location.pathname === "/"} />
                        <SidebarItem to="/history" icon={<FiUser />} label="History" isActive={location.pathname === "/history"} />
                        <SidebarItem to="/liked-videos" icon={<FiThumbsUp />} label="Liked" isActive={location.pathname === "/liked-videos"} />
                    </div>
                    
                    <div className="p-3 border-t border-neutral-900">
                        <SidebarItem to="/settings" icon={<FiSettings />} label="Settings" isActive={location.pathname === "/settings"} />
                    </div>
                </aside>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 sm:hidden transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                    ></div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto w-full bg-[#000000] relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

// Sidebar Item Component
const SidebarItem = ({ to, icon, label, isActive }) => (
    <Link 
        to={to} 
        className={`flex items-center gap-3.5 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium group
        ${isActive 
            ? "bg-[#1a1a1a] text-white" 
            : "text-neutral-400 hover:bg-[#111111] hover:text-neutral-200"
        }`}
    >
        <span className={`text-lg transition-colors ${isActive ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"}`}>
            {icon}
        </span>
        <span>{label}</span>
    </Link>
);

export default Layout;