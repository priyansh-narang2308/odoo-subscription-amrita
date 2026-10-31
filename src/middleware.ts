import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

const PUBLIC = ["/login", "/signup", "/forgot-password", "/reset-password"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // The landing page and logout are open to everyone, signed in or not
  if (pathname === "/" || pathname === "/logout") return NextResponse.next();
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!session) {
    if (isPublic) return NextResponse.next();
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const home = session.role === "PORTAL" ? "/my" : "/home";
  if (isPublic) return NextResponse.redirect(new URL(home, req.url));

  // Portal customers stay in the portal; staff stay out of it
  const inPortal = pathname === "/my" || pathname.startsWith("/my/");
  if (session.role === "PORTAL" && !inPortal) return NextResponse.redirect(new URL("/my", req.url));
  if (session.role !== "PORTAL" && inPortal) return NextResponse.redirect(new URL("/home", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
