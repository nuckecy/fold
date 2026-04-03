"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface MobileNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/gdpr", label: "GDPR" },
  { href: "/dashboard/admin", label: "Admin" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="lg:hidden border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Fold
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav className="px-4 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="px-3 py-1 text-sm font-medium truncate">{user.name}</div>
            <div className="px-3 text-xs text-neutral-500 truncate">{user.email}</div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="mt-2 px-3 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Sign out
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
