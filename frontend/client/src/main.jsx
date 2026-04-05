import React from 'react'
import 'video.js/dist/video-js.css'; // <--- Kept safely here
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'; // <--- 1. NEW IMPORT
import store from './store/store.js'
import Layout from './Layout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from "./pages/Signup.jsx";
import VideoDetail from './pages/VideoDetail.jsx'
import UploadVideo from './pages/UploadVideo.jsx'
import AuthLayout from './components/AuthLayout.jsx' 
import './index.css'
import { Toaster } from 'react-hot-toast'
import Search from './pages/Search.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Channel from './pages/Channel.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx' 
import WatchHistory from './pages/History.jsx'; // 

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/watch/:videoId", element: <VideoDetail /> },
      {
        path: "/search/:query",  
        element: <Search />,
      },
      { 
        path: "/upload", 
        element: (
            <AuthLayout authentication>
                <UploadVideo />
            </AuthLayout>
        ) 
      },
      {
        path: "/dashboard",
        element: <Dashboard />
      },
      {
        path: "/c/:username",
        element: <Channel />, 
      },
      {
        path: "/history",
        element: <WatchHistory />, 
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  // 2. Wrap EVERYTHING in the GoogleOAuthProvider
  <GoogleOAuthProvider clientId="191082218634-nsllh0vnumrpncaecdm3sbop64b3h2a9.apps.googleusercontent.com">
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </ThemeProvider>
    </Provider>
  </GoogleOAuthProvider>
)