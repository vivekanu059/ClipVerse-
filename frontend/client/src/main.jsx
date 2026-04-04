import React from 'react'
import 'video.js/dist/video-js.css'; // <--- Kept safely here
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
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
// 1. Import the ThemeProvider
import { ThemeProvider } from './context/ThemeContext.jsx' // Ensure this path matches your folder structure!
import WatchHistory from './pages/History.jsx';

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
        path: "/search/:query", // 
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
  <Provider store={store}>
    {/* 2. Wrap the RouterProvider with the ThemeProvider */}
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </ThemeProvider>
  </Provider>,
)