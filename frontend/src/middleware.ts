import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["ja", "en", "vi"];
const defaultLocale = "ja";

const BOT_UA_RE = /(googlebot|googleother|google-inspectiontool|bingbot|msnbot|yandexbot|applebot|duckduckbot|baiduspider|oai-searchbot|chatgpt-user|gptbot|claude-searchbot|claude-user|claudebot|perplexitybot|perplexity-user)/i;

function getLocale(request: NextRequest): string {
  // Always serve Japanese canonical locale to search & AI bots on non-localized paths
  const ua = request.headers.get("user-agent") || "";
  if (BOT_UA_RE.test(ua)) {
    return defaultLocale;
  }

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

  // Use public origin instead of internal proxy request.url (http://localhost:3000)
  const publicBase = host && !host.includes("localhost") && !host.includes("127.0.0.1")
    ? `https://${host}`
    : (process.env.NEXTAUTH_URL || request.url);

  // Block security scanner probe files immediately with 404 (prevents matching [locale] and returning 200)
  if (
    pathname.startsWith("/.") ||
    /^\/(?:config\.env|gc-service\.json|wrangler\.toml|docker-compose\.yml|package\.json|tsconfig\.json|\.env.*)$/i.test(pathname)
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Redirect legacy / hallucinated /index.html or broken relative domain prefixes to /ja
  if (pathname === "/index.html" || pathname === "/index.htm" || pathname === "/index.php") {
    return NextResponse.redirect(new URL(`/ja${search}`, publicBase), 308);
  }
  if (pathname.startsWith("/index.html/")) {
    const cleanSub = pathname.slice("/index.html".length);
    return NextResponse.redirect(new URL(`/ja${cleanSub}${search}`, publicBase), 308);
  }
  const firstSegment = pathname.split("/")[1] || "";
  if (firstSegment.includes(":") || firstSegment.includes("%3A") || firstSegment.includes("%3a") || (firstSegment.includes(".") && pathname.split("/").length > 2)) {
    const restPath = "/" + pathname.split("/").slice(2).join("/");
    if (restPath.startsWith("/company/") || restPath.startsWith("/industry/") || restPath.startsWith("/area/")) {
      return NextResponse.redirect(new URL(`/ja${restPath}${search}`, publicBase), 308);
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  // Bypass API routes, static assets, sitemaps, llms.txt, and Next.js internal folders
  const isBypass = 
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") || 
    pathname.startsWith("/static") ||
    pathname.startsWith("/sitemap") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    /^\/[^/]+\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|css|js|xml|txt|webmanifest)$/i.test(pathname);

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
    publicBase
  );

  // Return 308 Permanent Redirect for SEO canonical consistency
  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  // Matcher ignoring API routes and static file extensions
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap).*)"],
};

