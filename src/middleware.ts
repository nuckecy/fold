import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicForm = req.nextUrl.pathname.startsWith("/f/");

  // Allow public routes
  if (isApiAuth || isPublicForm) {
    return;
  }

  // Redirect unauthenticated users to sign in
  if (!isLoggedIn && !isAuthPage) {
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(signInUrl);
  }

  // Redirect authenticated users away from auth pages (except profile completion)
  const isProfileCompletion = req.nextUrl.pathname === "/auth/complete-profile";
  if (isLoggedIn && isAuthPage && !isProfileCompletion) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
