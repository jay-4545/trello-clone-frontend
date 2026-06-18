import Cookies from "js-cookie";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

const cookieBase = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict" as const,
};

export interface JwtPayload {
    exp?: number;
    id?: number;
    email?: string;
    role?: string;
}

export function decodeJwtPayload<T extends JwtPayload = JwtPayload>(jwt: string): T | null {
    try {
        const part = jwt.split(".")[1];
        if (!part) return null;
        const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(base64);
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

export function getTokenExpiry(jwt: string | null | undefined): number | null {
    if (!jwt) return null;
    const payload = decodeJwtPayload(jwt);
    return payload?.exp ?? null;
}

/** True if token is missing, unparseable, or past expiry (with optional buffer). */
export function isTokenExpired(jwt: string | null | undefined, bufferSeconds = 0): boolean {
    if (!jwt) return true;
    const exp = getTokenExpiry(jwt);
    if (!exp) return false;
    return Date.now() >= (exp - bufferSeconds) * 1000;
}

export const token = {
    getAccess: () => Cookies.get(ACCESS_KEY) ?? null,
    getRefresh: () => Cookies.get(REFRESH_KEY) ?? null,

    setAccess: (t: string) => {
        const exp = getTokenExpiry(t);
        Cookies.set(ACCESS_KEY, t, {
            ...cookieBase,
            ...(exp ? { expires: new Date(exp * 1000) } : {}),
        });
    },

    setRefresh: (t: string) => {
        const exp = getTokenExpiry(t);
        Cookies.set(REFRESH_KEY, t, {
            ...cookieBase,
            expires: exp ? new Date(exp * 1000) : 7,
        });
    },

    setTokenPair: (access: string, refresh: string) => {
        token.setAccess(access);
        token.setRefresh(refresh);
    },

    clearAll: () => {
        Cookies.remove(ACCESS_KEY);
        Cookies.remove(REFRESH_KEY);
    },

    hasRefresh: () => !!Cookies.get(REFRESH_KEY),

    hasSession: () => !!Cookies.get(ACCESS_KEY) || !!Cookies.get(REFRESH_KEY),

    isAccessTokenExpired: (bufferSeconds = 30) =>
        isTokenExpired(token.getAccess(), bufferSeconds),

    isAccessTokenExpiringSoon: (bufferSeconds = 120) =>
        isTokenExpired(token.getAccess(), bufferSeconds),

    isRefreshTokenExpired: (bufferSeconds = 0) =>
        isTokenExpired(token.getRefresh(), bufferSeconds),
};
