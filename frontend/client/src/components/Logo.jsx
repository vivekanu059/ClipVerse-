import React from 'react';
import { FiPlay } from 'react-icons/fi';

function Logo({ size = 'h-8 w-8', showName = true }) {
    return (
        <span className="flex items-center gap-2.5">
            <span className={`${size} grid place-items-center rounded-lg bg-amber-400 text-black`}><FiPlay className="ml-0.5" /></span>
            {showName && <span className="font-['Bricolage_Grotesque',sans-serif] text-xl font-extrabold tracking-tight text-white">ClipVerse</span>}
        </span>
    );
}
export default Logo;