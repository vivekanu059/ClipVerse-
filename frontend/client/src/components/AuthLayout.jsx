import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

/**
 * authentication = true  -> page needs a logged-in user
 * authentication = false -> page is for guests only (login, signup)
 */
export default function AuthLayout({ children, authentication = true }) {
    const navigate = useNavigate();
    const { status, loading } = useSelector((state) => state.auth);
    const allowed = !!status === authentication;

    // Protected pages must wait until we know whether the user is logged in (e.g. after a refresh)
    const waiting = loading && authentication;

    useEffect(() => {
        if (!waiting && !allowed) navigate(authentication ? '/login' : '/', { replace: true });
    }, [waiting, allowed, authentication, navigate]);

    if (waiting || !allowed) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#0a0a0c]" role="status" aria-label="Loading">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-amber-400" />
            </div>
        );
    }
    return <>{children}</>;
}