import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { MobileNav } from "@/components/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  // Profile completion gate for Google OAuth users
  if (!(session as any).profileComplete) {
    redirect("/auth/complete-profile");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav user={session.user} />
      <div className="flex-1 flex flex-col">
        <MobileNav user={session.user} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
