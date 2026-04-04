import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CaptureNav } from "@/components/capture-nav";

export const metadata = {
  title: "Fold Capture",
  description: "Capture attendee data from events",
};

export default async function CaptureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/signin?callbackUrl=/capture");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-lg font-bold tracking-tight">Fold Capture</span>
        <div className="text-xs text-neutral-500 truncate max-w-[150px]">
          {session.user.name || session.user.email}
        </div>
      </header>

      {/* Content — padded for bottom nav */}
      <main className="flex-1 px-4 py-4 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Bottom tab nav */}
      <CaptureNav />
    </div>
  );
}
