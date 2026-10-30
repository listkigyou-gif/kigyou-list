import { NextRequest, NextResponse } from "next/server";

function clearAllAuthCookies(response: NextResponse, isHttps: boolean) {
  const cookieNamesToClear = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "next-auth.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    "next-auth.callback-url",
  ];

  cookieNamesToClear.forEach((name) => {
    const isSecurePrefix = name.startsWith("__Secure-") || name.startsWith("__Host-");
    response.cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      maxAge: 0,
      httpOnly: true,
      secure: isSecurePrefix || isHttps,
      sameSite: "lax",
    });
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
}

export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const forwardedProto = request.headers.get("x-forwarded-proto") || (isDev ? "http" : "https");
  const isHttps = !isDev && (forwardedProto === "https" || (process.env.NEXTAUTH_URL || "").startsWith("https"));

  const response = NextResponse.json({ success: true, loggedOut: true });
  clearAllAuthCookies(response, isHttps);
  return response;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let callbackUrl = searchParams.get("callbackUrl") || "/ja";

  if (
    !callbackUrl.startsWith("/") ||
    callbackUrl.includes("/admin") ||
    callbackUrl.includes("/dashboard")
  ) {
    callbackUrl = "/ja";
  }

  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  let baseUrl = process.env.NEXTAUTH_URL || "https://kigyoulist.com";
  if (forwardedHost && !forwardedHost.includes("localhost") && !forwardedHost.includes("127.0.0.1")) {
    baseUrl = `${forwardedProto}://${forwardedHost}`;
  }

  const redirectUrl = new URL(callbackUrl, baseUrl);
  const response = NextResponse.redirect(redirectUrl, 302);
  clearAllAuthCookies(response, baseUrl.startsWith("https"));
  return response;
}
