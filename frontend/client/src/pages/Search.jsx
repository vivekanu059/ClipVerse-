import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { format } from 'timeago.js';

function Search() {
    const { query } = useParams(); // Get the search term from the URL
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSearchResults = async () => {
            setLoading(true);
            try {
                // Assuming your backend /videos route accepts a ?query parameter
                const res = await axiosInstance.get(`/videos?query=${query}`);
                setVideos(res.data.data.docs || res.data.data);
            } catch (error) {
                console.error("Error fetching search results:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [query]); // Re-run if the user searches for something else

    if (loading) {
        return <div className="text-textMuted text-center mt-10">Searching for "{query}"...</div>;
    }

    return (
        <div className="w-full max-w-7xl mx-auto pb-10">
            <h2 className="text-white text-xl font-semibold mb-6">
                Search results for <span className="text-primary">"{query}"</span>
            </h2>

            {videos.length === 0 ? (
                <div className="text-center text-textMuted mt-20">
                    <p className="text-xl font-bold text-white mb-2">No results found</p>
                    <p>Try different keywords or remove search filters</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {videos.map((video) => (
                        <Link to={`/watch/${video._id}`} key={video._id} className="group flex flex-col sm:flex-row gap-4 cursor-pointer hover:bg-surface/30 p-2 rounded-xl transition-colors">
                            {/* Thumbnail */}
                            <div className="relative w-full sm:w-[360px] aspect-video rounded-xl overflow-hidden bg-surface shrink-0">
                                <img 
                                    src={video.thumbnail} 
                                    alt={video.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                                <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                                    {formatDuration(video.duration)}
                                </span>
                            </div>

                            {/* Video Info (List View Style) */}
                            <div className="flex flex-col py-1 overflow-hidden">
                                <h3 className="text-white text-lg sm:text-xl font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                    {video.title}
                                </h3>
                                <p className="text-textMuted text-xs sm:text-sm mt-1">
                                    {video.views} views • {format(video.createdAt)}
                                </p>
                                
                                <div className="flex items-center gap-2 mt-3 mb-2">
                                    <img 
                                        src={video.owner.avatar} 
                                        className="w-6 h-6 rounded-full object-cover" 
                                        alt={video.owner.username} 
                                    />
                                    <p className="text-textMuted text-xs sm:text-sm hover:text-white transition-colors">
                                        {video.owner.username}
                                    </p>
                                </div>

                                <p className="text-textMuted text-xs sm:text-sm line-clamp-2 hidden sm:block">
                                    {video.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(14, 5);
};

export default Search;