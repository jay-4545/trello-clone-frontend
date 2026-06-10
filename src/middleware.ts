import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Anyone can visit these paths (logged in or not)
const PUBLIC_PATHS = ["/", "/login", "/register"];
// Logged-in users get redirected away from these (auth-only pages)
const AUTH_REDIRECT_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
    const accessToken = request.cookies.get("access_token")?.value;
    const { pathname } = request.nextUrl;

    const isPublic = PUBLIC_PATHS.some((p) =>
        p === "/" ? pathname === "/" : pathname.startsWith(p)
    );
    const isAuthRedirect = AUTH_REDIRECT_PATHS.some((p) => pathname.startsWith(p));

    if (!accessToken && !isPublic) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (accessToken && isAuthRedirect) {
        return NextResponse.redirect(new URL("/workspaces", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};