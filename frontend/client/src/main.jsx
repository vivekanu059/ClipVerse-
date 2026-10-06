import React from 'react';
import 'video.js/dist/video-js.css';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import store from './store/store.js';
import Layout from './Layout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import VideoDetail from './pages/VideoDetail.jsx';
import UploadVideo from './pages/UploadVideo.jsx';
import Search from './pages/Search.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Channel from './pages/Channel.jsx';
import WatchHistory from './pages/History.jsx';
import AuthLayout from './components/AuthLayout.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';

// Set VITE_GOOGLE_CLIENT_ID in .env; the fallback keeps the current setup working
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '191082218634-nsllh0vnumrpncaecdm3sbop64b3h2a9.apps.googleusercontent.com';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/login', element: <AuthLayout authentication={false}><Login /></AuthLayout> },
            { path: '/signup', element: <AuthLayout authentication={false}><Signup /></AuthLayout> },
            { path: '/watch/:videoId', element: <VideoDetail /> },
            { path: '/search/:query', element: <Search /> },
            { path: '/upload', element: <AuthLayout authentication><UploadVideo /></AuthLayout> },
            { path: '/dashboard', element: <AuthLayout authentication><Dashboard /></AuthLayout> },
            { path: '/c/:username', element: <Channel /> },
            { path: '/history', element: <AuthLayout authentication><WatchHistory /></AuthLayout> },
        ],
    },
]);

const toastStyle = { background: '#16161b', color: '#fff', border: '1px solid rgba(255,255,255,.1)', borderRadius: '12px', fontSize: '14px' };

ReactDOM.createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Provider store={store}>
            <ThemeProvider>
                <RouterProvider router={router} />
                <Toaster position="top-right" toastOptions={{ style: toastStyle, success: { iconTheme: { primary: '#fbbf24', secondary: '#000' } } }} />
            </ThemeProvider>
        </Provider>
    </GoogleOAuthProvider>
);