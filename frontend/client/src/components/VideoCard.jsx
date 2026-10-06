import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, timeAgo, compact } from '../utils/format';

function VideoCard({ video, showOwner = true }) {
    const owner = showOwner ? video.owner : null;
    return (
        <article className="group">
            <Link to={`/watch/${video._id}`} aria-label={video.title} className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/5 transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/20 group-hover:shadow-[0_18px_40px_-18px_rgba(251,191,36,.35)]">
                    <img src={video.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 transition group-hover:opacity-100" />
                    {video.duration > 0 && (
                        <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur">{formatDuration(video.duration)}</span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-amber-400 transition-transform duration-500 group-hover:scale-x-100" />
                </div>
            </Link>

            <div className="mt-3 flex items-start gap-3">
                {owner && (
                    <Link to={`/c/${owner.username}`} tabIndex={-1} aria-hidden className="shrink-0">
                        <img src={owner.avatar} alt="" className="h-9 w-9 rounded-full bg-zinc-800 object-cover ring-1 ring-white/10 transition hover:ring-amber-400" />
                    </Link>
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-100">
                        <Link to={`/watch/${video._id}`} className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">{video.title}</Link>
                    </h3>
                    {owner && (
                        <Link to={`/c/${owner.username}`} className="mt-1 block truncate text-[13px] font-medium text-zinc-400 hover:text-white">{owner.username}</Link>
                    )}
                    <p className={`${owner ? '' : 'mt-1'} whitespace-nowrap text-[13px] text-zinc-500`}>
                        {compact(video.views)} {video.views === 1 ? 'play' : 'plays'} <span aria-hidden className="mx-0.5">·</span> {timeAgo(video.createdAt)}
                    </p>
                </div>
            </div>
        </article>
    );
}
export default VideoCard;