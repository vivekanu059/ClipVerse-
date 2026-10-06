import React from 'react';
import Logo from './Logo';

// Left-hand brand panel for Login / Signup. The amber spotlight follows the cursor.
function BrandPanel({ title, text }) {
    const onMove = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
    };
    return (
        <div onMouseMove={onMove} style={{ '--x': '30%', '--y': '30%' }}
            className="relative hidden w-1/2 flex-col justify-between self-start overflow-hidden border-r border-white/5 p-12 lg:sticky lg:top-0 lg:flex lg:h-screen">
            <div className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(520px circle at var(--x) var(--y), rgba(251,191,36,.16), transparent 60%)' }} />
            <div className="relative"><Logo /></div>
            <div className="relative max-w-md">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] text-5xl font-extrabold leading-[1.05] tracking-tight text-white">{title}</h2>
                <p className="mt-5 text-zinc-400">{text}</p>
            </div>
        </div>
    );
}
export default BrandPanel;