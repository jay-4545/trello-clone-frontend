import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Anyone can visit these paths without a cookie (cookie may still be expired — validated by API)
const PUBLIC_PATHS = ["/", "/login", "/register", "/verify-email"];

export function middleware(request: NextRequest) {
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;
    const hasSession = !!(accessToken || refreshToken);
    const { pathname } = request.nextUrl;

    const isPublic = PUBLIC_PATHS.some((p) =>
        p === "/" ? pathname === "/" : pathname.startsWith(p)
    );

    // Allow protected routes when a refresh token exists so the client can rotate tokens.
    // Do NOT redirect /login → /workspaces here (stale cookie loops).
    if (!hasSession && !isPublic) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};