import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "";

  // Check if limit parameter already exists
  if (req.nextUrl.searchParams.has("limit")) {
    return NextResponse.next();
  }

  // Detect if it's a mobile device
  const isMobile = /Mobi|Android|iPhone/i.test(userAgent);

  // Get the pathname to determine page-specific limits
  const pathname = req.nextUrl.pathname;

  // Define page-specific limits
  let mobileLimit = "3";
  let desktopLimit = "5";

  if (pathname.startsWith("/manage-customers")) {
    mobileLimit = "3";
    desktopLimit = "5";
  } else if (pathname.startsWith("/manage-products")) {
    mobileLimit = "5";
    desktopLimit = "5";
  } else if (pathname.startsWith("/manage-returns")) {
    mobileLimit = "3";
    desktopLimit = "4";
  } else if (pathname.startsWith("/admin-dashboard")) {
    mobileLimit = "4";
    desktopLimit = "5";
  }

  // Clone the request URL
  const url = req.nextUrl.clone();

  // Add a query parameter "limit" based on device and page
  url.searchParams.set("limit", isMobile ? mobileLimit : desktopLimit);

  console.log("MIDDLEWARE URL:", url.toString());

  // Use redirect instead of rewrite so the URL changes in the browser
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/admin-dashboard/:path*",
    "/manage-customers/:path*", 
    "/manage-products/:path*",
    "/manage-returns/:path*"
  ]
};