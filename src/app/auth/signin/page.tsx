"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

type Mode = "password" | "magic-link";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered");
  const magicError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    magicError === "invalid_link"
      ? "This sign-in link is invalid."
      : magicError === "expired_link"
        ? "This sign-in link has expired. Please request a new one."
        : ""
  );
  const [success, setSuccess] = useState(
    registered ? "Account created. Please sign in." : ""
  );
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Failed to send magic link");
      return;
    }

    setMagicSent(true);
    setSuccess("If an account exists with this email, a sign-in link has been sent. Check your inbox.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Fold</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex rounded-md border border-neutral-300 dark:border-neutral-700 overflow-hidden">
          <button
            type="button"
            onClick={() => { setMode("password"); setMagicSent(false); setError(""); setSuccess(""); }}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              mode === "password"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode("magic-link"); setError(""); setSuccess(""); }}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              mode === "magic-link"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            Magic link
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : magicSent ? (
          <div className="text-center py-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Check your email for the sign-in link.
            </p>
            <button
              onClick={() => { setMagicSent(false); setSuccess(""); }}
              className="mt-4 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Send another link
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <div>
              <label htmlFor="magic-email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="magic-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {loading ? "Sending link..." : "Send magic link"}
            </button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-neutral-500">or</span>
          </div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Continue with Google
        </button>

        <p className="text-center text-sm text-neutral-500">
          Do not have an account?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
