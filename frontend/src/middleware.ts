import { NextRequest, NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Define public paths that don't require authentication
  const PUBLIC_PATHS = ['/login', '/register', '/api', '/forgot-password'];
  
  // Define auth paths that authenticated users shouldn't access
  const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

  // Get token from cookies
  const token = req.cookies.get('token')?.value;

  // If user is on an auth path (login, register, etc.)
  if (AUTH_PATHS.includes(pathname)) {
    // If user has token, redirect to messages
    if (token) {
      return NextResponse.redirect(new URL('/messages', req.url));
    }
    // If no token, allow access to auth pages
    return NextResponse.next();
  }

  // If user is on public paths (API routes, static files, etc.)
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For protected routes, check if user has token
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If user is on root path and has token, redirect to messages
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/messages', req.url));
  }

  // Allow access to protected routes
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|static|.*\\..*|_next).*)"],
};