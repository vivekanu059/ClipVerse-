import React from 'react'
// src/main.jsx
import 'video.js/dist/video-js.css'; // <--- MAKE SURE THIS LINE IS HERE
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import store from './store/store.js'
import Layout from './Layout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import VideoDetail from './pages/VideoDetail.jsx'
import UploadVideo from './pages/UploadVideo.jsx'
import AuthLayout from './components/AuthLayout.jsx' // A wrapper to protect routes
import './index.css'
import { Toaster } from 'react-hot-toast'
import Signup from "./pages/Signup.jsx";
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
        path: "/upload", 
        element: (
            <AuthLayout authentication>
                <UploadVideo />
            </AuthLayout>
        ) 
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router} />
    <Toaster position="top-right" />
  </Provider>,
)