import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { initSocketSync } from "./socketManager";

/** Ensures the shared socket listener layer is initialized once for the app shell */
export function useNotificationSocket(enabled = true) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!enabled) return;
        initSocketSync(dispatch);
    }, [dispatch, enabled]);
}
