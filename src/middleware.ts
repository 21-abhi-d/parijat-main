import { NextResponse } from "next/server";

import { auth } from "~/server/auth";

/**
 * Route-level middleware.
 * - /admin/*  → requires session with role: 'admin'
 * - /account  → requires any valid session
 *
 * The admin layout provides a second enforcement layer as defence-in-depth.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const user = (session?.user ?? null) as (NonNullable<typeof session>["user"] & { role?: string }) | null;

  if (pathname.startsWith("/admin")) {
    if (!user || user.role !== "admin") {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
  }

  if (pathname.startsWith("/account")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
