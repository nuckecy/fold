import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CaptureNav } from "@/components/capture-nav";

export const metadata = {
  title: "Fold Capture",
  description: "Capture attendee data from events",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default async function CaptureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/signin?callbackUrl=/capture");

  return (
    <div className="flex justify-center min-h-screen bg-neutral-100 dark:bg-neutral-950">
      {/* Mobile shell — max 430px on desktop, full width on mobile */}
      <div className="relative flex flex-col w-full max-w-[430px] min-h-screen bg-white dark:bg-neutral-900 shadow-xl">
        {/* Top header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <span className="text-lg font-bold tracking-tight">Fold Capture</span>
          <div className="text-xs text-neutral-500 truncate max-w-[150px]">
            {session.user.name || session.user.email}
          </div>
        </header>

        {/* Content — padded for bottom nav */}
        <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
          {children}
        </main>

        {/* Bottom tab nav — constrained to shell */}
        <div className="absolute bottom-0 left-0 right-0">
          <CaptureNav />
        </div>
      </div>
    </div>
  );
}
