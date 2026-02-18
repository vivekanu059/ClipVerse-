import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
    withCredentials: true, 
});

// TEMPORARY DEBUGGING INTERCEPTOR
// This version strictly STOPS the loop. It does not try to refresh.
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // If we get a 401, just print it and Redirect to login.
        // DO NOT RETRY.
        if (error.response?.status === 401) {
            console.error("401 Unauthorized - Logging out to prevent loop.");
            
            // Optional: Only redirect if we are not already on the login page
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;