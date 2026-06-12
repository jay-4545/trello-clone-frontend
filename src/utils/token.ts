import Cookies from "js-cookie";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const token = {
    getAccess: () => Cookies.get(ACCESS_KEY) ?? null,
    getRefresh: () => Cookies.get(REFRESH_KEY) ?? null,
    setAccess: (t: string) => Cookies.set(ACCESS_KEY, t, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    }),
    setRefresh: (t: string) => Cookies.set(REFRESH_KEY, t, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        expires: 7,
    }),
    setTokenPair: (a: string, r: string) => { token.setAccess(a); token.setRefresh(r); },
    clearAll: () => { Cookies.remove(ACCESS_KEY); Cookies.remove(REFRESH_KEY); },
};