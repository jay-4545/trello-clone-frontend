import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
    const accessToken = request.cookies.get("access_token")?.value;
    const { pathname } = request.nextUrl;

    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

    if (!accessToken && !isPublic) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (accessToken && isPublic) {
        return NextResponse.redirect(new URL("/workspaces", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};