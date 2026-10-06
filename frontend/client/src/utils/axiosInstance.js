import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const axiosInstance = axios.create({ baseURL, withCredentials: true });

// Separate client with no interceptors, used only for the refresh call (avoids loops)
const refreshClient = axios.create({ baseURL, withCredentials: true });

// Endpoints where a 401 means "wrong details" or "not signed in", never "token expired"
const NO_REFRESH = ["/users/login", "/users/register", "/users/google-auth", "/users/refresh-Token"];

let refreshing = null; // shared, so many parallel 401s trigger only ONE refresh

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error;
        const url = config?.url || "";

        if (response?.status !== 401 || !config || config._retried || NO_REFRESH.some((p) => url.includes(p))) {
            return Promise.reject(error);
        }

        config._retried = true;
        try {
            refreshing ??= refreshClient.post("/users/refresh-Token").finally(() => { refreshing = null; });
            await refreshing;
            return axiosInstance(config); // retry the original request with the fresh cookie
        } catch {
            // Session is really over. Do NOT hard-redirect: public pages must keep working for guests.
            // Protected pages are handled by AuthLayout once the auth state updates.
            return Promise.reject(error);
        }
    }
);

export default axiosInstance;