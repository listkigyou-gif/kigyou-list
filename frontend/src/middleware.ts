import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["ja", "en", "vi"];
const defaultLocale = "ja";

function getLocale(request: NextRequest): string {
  // 1. Check NEXT_LOCALE cookie
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Parse Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const langs = acceptLanguage.split(",").map(lang => {
      const [code, q = "q=1"] = lang.split(";");
      const quality = parseFloat(q.split("=")[1] || "1");
      return { code: code.trim().split("-")[0], quality };
    });
    
    langs.sort((a, b) => b.quality - a.quality);
    
    for (const lang of langs) {
      if (locales.includes(lang.code)) {
        return lang.code;
      }
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Bypass API routes, static assets, and Next.js internal folders
  const isBypass = 
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") || 
    pathname.startsWith("/static") ||
    pathname.includes(".") || // e.g. favicon.ico, icon.svg, robots.txt, sitemap.xml
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  if (isBypass) {
    return NextResponse.next();
  }

  // Check if pathname has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect if no locale prefix is present
  const detectedLocale = getLocale(request);
  
  // Construct the new URL with the locale prefix
  const redirectUrl = new URL(
    `/${detectedLocale}${pathname === "/" ? "" : pathname}${search}`,
    request.url
  );

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  // Matcher ignoring API routes and static file extensions
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
