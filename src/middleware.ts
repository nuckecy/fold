import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // ─── Public routes (no auth required) ──────────────────────────────
  const isPublic =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/f/") ||           // Public digital forms
    pathname.startsWith("/scan/") ||        // Scanner join (public)
    pathname.startsWith("/unsubscribe") ||  // Unsubscribe page
    pathname.startsWith("/api/f/") ||       // Public form API
    pathname.startsWith("/api/scan/") ||    // Scanner join API
    pathname.startsWith("/api/unsubscribe") || // Unsubscribe API
    pathname.startsWith("/api/webhooks");   // Webhook endpoints

  if (isPublic) return;

  // ─── Auth pages ────────────────────────────────────────────────────
  const isAuthPage = pathname.startsWith("/auth");
  const isProfileCompletion = pathname === "/auth/complete-profile";

  if (!isLoggedIn && !isAuthPage) {
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(signInUrl);
  }

  if (isLoggedIn && isAuthPage && !isProfileCompletion) {
    return Response.redirect(new URL("/capture", req.nextUrl.origin));
  }

  // ─── Entry point auth guards ───────────────────────────────────────

  // /capture — any authenticated user (admin, sub_admin, scanner)
  // No additional check needed — auth is sufficient

  // /dashboard — admin or sub_admin (not scanner-only)
  // TODO: Check role from database when role is stored in JWT
  // For now, all authenticated users can access

  // /admin — Super Admin only
  // TODO: Check Super Admin flag from database
  // For now, all authenticated users can access
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
