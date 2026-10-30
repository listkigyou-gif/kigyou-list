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
  const host = request.headers.get("host") || "";
  const { pathname, search } = request.nextUrl;

  // 1. Force non-www permanent redirect if request came with www
  if (host.startsWith("www.")) {
    const nonWwwUrl = new URL(`https://kigyoulist.com${pathname}${search}`);
    return NextResponse.redirect(nonWwwUrl, 308);
  }

  // Bypass API routes, static assets, sitemaps, and Next.js internal folders
  const isBypass = 
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") || 
    pathname.startsWith("/static") ||
    pathname.startsWith("/sitemap") ||
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
  
  // Use public origin instead of internal proxy request.url (http://localhost:3000)
  const publicBase = host && !host.includes("localhost") && !host.includes("127.0.0.1")
    ? `https://${host}`
    : (process.env.NEXTAUTH_URL || request.url);

  // Construct the new URL with the locale prefix
  const redirectUrl = new URL(
    `/${detectedLocale}${pathname === "/" ? "" : pathname}${search}`,
    publicBase
  );

  // Return 308 Permanent Redirect for SEO canonical consistency
  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  // Matcher ignoring API routes and static file extensions
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap).*)"],
};

