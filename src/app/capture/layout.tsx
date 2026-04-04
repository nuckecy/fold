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
    <>
      {/* Desktop: iPhone device frame */}
      <div className="hidden md:flex fixed inset-0 items-center justify-center bg-neutral-200 dark:bg-neutral-950">
        {/* Device bezel */}
        <div className="relative w-[393px] h-[852px] bg-black rounded-[3rem] p-[12px] shadow-2xl">
          {/* Dynamic Island notch */}
          <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-full z-50" />

          {/* Screen */}
          <div className="relative w-full h-full bg-white dark:bg-neutral-900 rounded-[2.4rem] overflow-hidden flex flex-col">
            {/* Status bar spacer */}
            <div className="h-[54px] shrink-0" />

            {/* App header */}
            <header className="flex items-center justify-between px-5 py-2.5 border-b border-neutral-200 dark:border-neutral-800">
              <span className="text-[17px] font-bold tracking-tight">Fold Capture</span>
              <div className="text-[11px] text-neutral-500 truncate max-w-[120px]">
                {session.user.name || session.user.email}
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 px-5 py-4 pb-20 overflow-y-auto">
              {children}
            </main>

            {/* Bottom nav */}
            <div className="shrink-0">
              <CaptureNav />
            </div>

            {/* Home indicator */}
            <div className="flex justify-center py-2 shrink-0">
              <div className="w-[134px] h-[5px] bg-neutral-300 dark:bg-neutral-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: full-screen native feel */}
      <div className="md:hidden flex flex-col min-h-screen bg-white dark:bg-neutral-900">
        <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <span className="text-lg font-bold tracking-tight">Fold Capture</span>
          <div className="text-xs text-neutral-500 truncate max-w-[150px]">
            {session.user.name || session.user.email}
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-20 overflow-y-auto">
          {children}
        </main>

        <div className="fixed bottom-0 left-0 right-0">
          <CaptureNav />
        </div>
      </div>
    </>
  );
}
