import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Providers } from "@/components/providers";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <Providers>
      <div className="flex min-h-screen">
        <DashboardNav user={session.user} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </Providers>
  );
}
