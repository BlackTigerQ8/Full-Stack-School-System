import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { routeAccessMap } from "./lib/settings";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role?.toLowerCase();

    // Get locale from cookie or default to 'ar'
    const locale = req.cookies.get("NEXT_LOCALE")?.value || "ar";

    // Set locale cookie if not exists
    const response = NextResponse.next();
    if (!req.cookies.get("NEXT_LOCALE")) {
      response.cookies.set("NEXT_LOCALE", "ar");
    }

    // Set HTML lang and dir attributes via headers
    response.headers.set("x-locale", locale);
    response.headers.set("x-dir", locale === "ar" ? "rtl" : "ltr");

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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|auth).*)"],
};
