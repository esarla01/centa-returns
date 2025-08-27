import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "";

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
  } else if (pathname.startsWith("/user-action-logs")) {
    mobileLimit = "3";
    desktopLimit = "5";
  }

  // Clone the request URL
  const url = req.nextUrl.clone();

  // Check if limit parameter already exists and validate it
  const existingLimit = req.nextUrl.searchParams.get("limit");
  if (existingLimit) {
    const limitNum = parseInt(existingLimit);
    // If limit is greater than 5, cap it at 5
    if (limitNum > 5) {
      url.searchParams.set("limit", "5");
      console.log("MIDDLEWARE: Limit capped at 5 for security");
      return NextResponse.redirect(url);
    }
    // If limit is valid (≤ 5), allow the request to proceed
    return NextResponse.next();
  }

  // Detect if it's a mobile device
  const isMobile = /Mobi|Android|iPhone/i.test(userAgent);

  // Add a query parameter "limit" based on device and page (capped at 5)
  const calculatedLimit = isMobile ? mobileLimit : desktopLimit;
  const finalLimit = Math.min(parseInt(calculatedLimit), 5).toString();
  
  url.searchParams.set("limit", finalLimit);

  // Use redirect instead of rewrite so the URL changes in the browser
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/admin-dashboard/:path*",
    "/manage-customers/:path*", 
    "/manage-products/:path*",
    "/manage-returns/:path*",
    "/user-action-logs/:path*"
  ]
};