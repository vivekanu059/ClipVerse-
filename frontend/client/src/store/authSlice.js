import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

// Async thunk to fetch current user on app load
export const getCurrentUser = createAsyncThunk("auth/getCurrentUser", async () => {
    const response = await axiosInstance.get("/users/current-user");
    return response.data.data;
});

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
    reducers: {},
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

export default authSlice.reducer;