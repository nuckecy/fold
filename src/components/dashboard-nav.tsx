"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Events" },
];

export function DashboardNav({ user }: NavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-neutral-200 dark:border-neutral-800">
      <div className="p-6">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          Fold
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
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

      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="text-sm font-medium truncate">{user.name}</div>
        <div className="text-xs text-neutral-500 truncate">{user.email}</div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="mt-3 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
