import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, getCurrentUser } from './store/authSlice';
import { FiUpload, FiLogOut, FiMenu, FiClock, FiHome, FiThumbsUp, FiSearch, FiSettings, FiUser, FiBarChart2, FiX } from 'react-icons/fi';
import Logo from './components/Logo';

const SidebarItem = ({ to, icon, label, active }) => (
    <Link to={to} aria-current={active ? 'page' : undefined}
        className={`group relative flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-white/[0.07] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'}`}>
        {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-amber-400" />}
        <span className={`text-lg ${active ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{icon}</span>
        {label}
    </Link>
);

function Layout() {
    const { status, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const menuRef = useRef(null);
    const mainRef = useRef(null);

    useEffect(() => { dispatch(getCurrentUser()); }, [dispatch]);

    // Route change: close menus, return to top of the scrolling <main>, mirror query in the search box
    useEffect(() => {
        setMobileMenuOpen(false);
        setDropdownOpen(false);
        mainRef.current?.scrollTo(0, 0);
        if (pathname.startsWith('/search/')) setSearchQuery(decodeURIComponent(pathname.slice(8)));
    }, [pathname]);

    useEffect(() => {
        if (!dropdownOpen) return;
        const onDown = (e) => !menuRef.current?.contains(e.target) && setDropdownOpen(false);
        const onKey = (e) => e.key === 'Escape' && setDropdownOpen(false);
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [dropdownOpen]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) navigate(`/search/${encodeURIComponent(searchQuery.trim())}`);
    };

    // Login and Signup get the full screen, no app chrome
    if (pathname === '/login' || pathname === '/signup') {
        return <div className="h-screen overflow-y-auto bg-[#0a0a0c]"><Outlet /></div>;
    }

    const is = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
    const menuLink = 'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white';

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0c] font-['DM_Sans',sans-serif] text-zinc-100 selection:bg-amber-400/30">
            <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between gap-3 border-b border-white/5 bg-[#0a0a0c]/85 px-4 backdrop-blur-xl sm:px-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => setMobileMenuOpen((o) => !o)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen}
                        className="rounded-lg p-2 text-xl text-zinc-400 transition hover:bg-white/5 hover:text-white sm:hidden">
                        {mobileMenuOpen ? <FiX /> : <FiMenu />}
                    </button>
                    <Link to="/" aria-label="ClipVerse home" className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">
                        <span className="sm:hidden"><Logo size="h-8 w-8" showName={false} /></span>
                        <span className="hidden sm:block"><Logo size="h-8 w-8" /></span>
                    </Link>
                </div>

                <form onSubmit={handleSearch} role="search" className="relative mx-auto w-full max-w-xl flex-1">
                    <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search videos and creators" aria-label="Search"
                        className="w-full rounded-full bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white outline-none ring-1 ring-transparent transition placeholder:text-zinc-500 focus:bg-white/[0.08] focus:ring-amber-400/70" />
                </form>

                <div className="flex items-center gap-3">
                    {status ? (
                        <>
                            <Link to="/upload" className="flex items-center gap-2 rounded-full bg-amber-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-amber-300 active:scale-95 sm:px-4" aria-label="Upload a video">
                                <FiUpload className="text-base" strokeWidth={2.5} /><span className="hidden sm:inline">Upload</span>
                            </Link>
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setDropdownOpen((o) => !o)} aria-haspopup="menu" aria-expanded={dropdownOpen} aria-label="Account menu"
                                    className="block rounded-full ring-2 ring-transparent transition hover:ring-white/20 focus-visible:ring-amber-400">
                                    <img src={user?.avatar} alt="" className="h-9 w-9 rounded-full bg-zinc-800 object-cover" />
                                </button>
                                {dropdownOpen && (
                                    <div role="menu" className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl bg-[#16161b] py-1 shadow-2xl ring-1 ring-white/10">
                                        <div className="border-b border-white/5 px-4 py-3">
                                            <p className="truncate text-sm font-semibold text-white">{user?.fullName}</p>
                                            <p className="mt-0.5 truncate text-xs text-zinc-500">@{user?.username}</p>
                                        </div>
                                        <Link role="menuitem" to={`/c/${user?.username}`} className={menuLink}><FiUser /> Your channel</Link>
                                        <Link role="menuitem" to="/dashboard" className={menuLink}><FiBarChart2 /> Dashboard</Link>
                                        <div className="my-1 h-px bg-white/5" />
                                        <button role="menuitem" onClick={handleLogout} className={menuLink}><FiLogOut /> Log out</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hidden text-sm font-medium text-zinc-400 transition hover:text-white sm:block">Log in</Link>
                            <Link to="/signup" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300">Join</Link>
                        </>
                    )}
                </div>
            </header>

            <div className="flex h-full w-full pt-16">
                <aside className={`fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-white/5 bg-[#0c0c0f] transition-transform duration-300 ease-out sm:static ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
                    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Main">
                        <SidebarItem to="/" icon={<FiHome />} label="Home" active={is('/')} />
                        <SidebarItem to="/history" icon={<FiClock />} label="History" active={is('/history')} />
                        <SidebarItem to="/liked-videos" icon={<FiThumbsUp />} label="Liked videos" active={is('/liked-videos')} />
                        {status && (
                            <>
                                <div className="mx-3 my-4 h-px bg-white/5" />
                                <SidebarItem to={`/c/${user?.username}`} icon={<FiUser />} label="Your channel" active={is('/c/')} />
                                <SidebarItem to="/dashboard" icon={<FiBarChart2 />} label="Dashboard" active={is('/dashboard')} />
                            </>
                        )}
                    </nav>
                    <div className="border-t border-white/5 p-3">
                        <SidebarItem to="/settings" icon={<FiSettings />} label="Settings" active={is('/settings')} />
                    </div>
                </aside>

                {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm sm:hidden" onClick={() => setMobileMenuOpen(false)} />}

                <main ref={mainRef} className="relative w-full flex-1 overflow-y-auto bg-[#0a0a0c]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
export default Layout;