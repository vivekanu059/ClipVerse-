import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export default function AuthLayout({ children, authentication = true }) {
    const navigate = useNavigate()
    const [loader, setLoader] = useState(true)
    const authStatus = useSelector(state => state.auth.status)

    useEffect(() => {
        // if auth is required (true) and user is not logged in (authStatus is false), go to login
        if (authentication && authStatus !== authentication) {
            navigate("/login")
        } 
        // if auth is not required (false) but user IS logged in, go to home
        else if (!authentication && authStatus !== authentication) {
            navigate("/")
        }
        
        const timer = setTimeout(() => setLoader(false), 0)
        return () => clearTimeout(timer)
    }, [authStatus, navigate, authentication])

    return loader ? <h1>Loading...</h1> : <>{children}</>
}