import { NextResponse } from "next/server";
import { auth } from "~/server/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  if (!isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware only on routes that need protection.
  // Role check for /admin is enforced again in the admin layout (defence-in-depth).
  matcher: ["/admin/:path*", "/account/:path*"],
};
