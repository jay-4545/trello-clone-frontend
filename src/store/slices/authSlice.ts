import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/auth.types";
import { token } from "@/utils/token";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isInitialized: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) => {
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.isInitialized = true;
            token.setTokenPair(action.payload.accessToken, action.payload.refreshToken);
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isInitialized = true;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isInitialized = true;
            token.clearAll();
        },
        updateTokens: (state) => {
            state.isAuthenticated = true;
            state.isInitialized = true;
        },
        setInitialized: (state) => {
            state.isInitialized = true;
        },
    },
});

export const { setCredentials, setUser, logout, setInitialized, updateTokens } = authSlice.actions;
export default authSlice.reducer;