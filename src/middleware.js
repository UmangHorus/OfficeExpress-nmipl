// src/middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const isEmployee = request.cookies.get("isEmployee")?.value === "true";

  const authRoutes = ["/login", "/"];
  const employeeOnlyRoutes = ["/dashboard", "/settings"];
  const protectedRoutes = ["/leads", ...employeeOnlyRoutes];

  // Special case: Don't redirect if we're in the registration flow
  if (
    pathname === "/login" &&
    request.nextUrl.searchParams.get("step") === "register"
  ) {
    return NextResponse.next();
  }

  // 1. Redirect authenticated users away from auth pages
  if (token && authRoutes.includes(pathname)) {
    const defaultRedirect = isEmployee ? "/dashboard" : "/leads";
    return NextResponse.redirect(new URL(defaultRedirect, request.url));
  }

  // 2. Protect all routes - redirect to login if no token
  if (!token && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Role-based access control
  if (token) {
    // Block non-employees from accessing employee-only routes
    if (
      !isEmployee &&
      employeeOnlyRoutes.some((route) => pathname.startsWith(route))
    ) {
      return NextResponse.redirect(new URL("/leads", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|auth).*)"],
};
