import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { routeAccessMap } from "./lib/settings";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role?.toLowerCase();

    // Check route access
    for (const [route, allowedRoles] of Object.entries(routeAccessMap)) {
      const routeRegex = new RegExp(`^${route.replace("(.*)", ".*")}$`);
      if (routeRegex.test(req.nextUrl.pathname)) {
        if (!allowedRoles.includes(role!)) {
          return NextResponse.redirect(new URL(`/${role}`, req.url));
        }
        // IMPORTANT: Break after first match to prevent further checking
        break;
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
