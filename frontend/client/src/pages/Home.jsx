import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Link } from 'react-router-dom';
import { format } from 'timeago.js';

function Home() {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        axiosInstance.get("/videos").then(res => {
            setVideos(res.data.data.docs || res.data.data); // Handle pagination structure
        });
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
                <Link to={`/watch/${video._id}`} key={video._id} className="group cursor-pointer">
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                        <span className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-2 py-0.5 text-xs rounded">
                            {formatDuration(video.duration)}
                        </span>
                    </div>
                    <div className="flex gap-3 mt-3">
                        <img src={video.owner.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                        <div>
                            <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                            <p className="text-xs text-gray-400 mt-1">{video.owner.username}</p>
                            <p className="text-xs text-gray-400">{video.views} views • {format(video.createdAt)}</p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

// Helper for duration formatting
const formatDuration = (seconds) => {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(14, 5);
};

export default Home;