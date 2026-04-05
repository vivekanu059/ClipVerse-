import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

// Async thunk to fetch current user on app load
export const getCurrentUser = createAsyncThunk("auth/getCurrentUser", async () => {
    const response = await axiosInstance.get("/users/current-user");
    return response.data.data;
});

// Async thunk for logging out via backend
export const logoutUser = createAsyncThunk("auth/logout", async () => {
    await axiosInstance.post("/users/logout");
});

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        loading: true,
        status: false,
    },
    reducers: {
        // --- NEW: Synchronous actions for UI login/logout ---
        login: (state, action) => {
            state.status = true;
            state.loading = false;
            // Support both direct user payloads and nested { user: ... } payloads
            state.user = action.payload?.user ? action.payload.user : action.payload;
        },
        logout: (state) => {
            state.status = false;
            state.user = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.status = true;
                state.user = action.payload;
            })
            .addCase(getCurrentUser.rejected, (state) => {
                state.loading = false;
                state.status = false;
                state.user = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.status = false;
            });
    },
});

// Explicitly export the synchronous actions so Signup.jsx and Login.jsx can use them!
export const { login, logout } = authSlice.actions;

export default authSlice.reducer;