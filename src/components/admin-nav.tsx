"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/ai", label: "AI Billing" },
  { href: "/admin/emails", label: "Email Insights" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/gdpr", label: "GDPR" },
  { href: "/admin/features", label: "Feature Flags" },
  { href: "/admin/performance", label: "Performance" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-neutral-200 dark:border-neutral-800">
      <div className="p-6">
        <Link href="/admin" className="text-xl font-bold tracking-tight">
          Fold Admin
        </Link>
        <div className="text-xs text-neutral-500 mt-0.5">Super Admin</div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        <Link href="/dashboard" className="block text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          Switch to Dashboard
        </Link>
        <Link href="/capture" className="block text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          Switch to Capture
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
