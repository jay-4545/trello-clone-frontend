import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Anyone can visit these paths without a cookie (cookie may still be expired — validated by API)
const PUBLIC_PATHS = ["/", "/login", "/register", "/verify-email"];

export function middleware(request: NextRequest) {
    const accessToken = request.cookies.get("access_token")?.value;
    const { pathname } = request.nextUrl;

    const isPublic = PUBLIC_PATHS.some((p) =>
        p === "/" ? pathname === "/" : pathname.startsWith(p)
    );

    // Only gate protected routes. Do NOT redirect /login → /workspaces here:
    // a stale cookie caused middleware → workspaces → API 401 → /login loops.
    if (!accessToken && !isPublic) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};