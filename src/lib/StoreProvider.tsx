"use client";
import { useRef } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import AuthProvider from "@/components/auth/AuthProvider";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
    const storeRef = useRef(store);
    return (
        <Provider store={storeRef.current}>
            <AuthProvider>{children}</AuthProvider>
        </Provider>
    );
}