import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";

export const metadata = {
  title: "Fold Admin",
  description: "Super Admin platform management",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/signin?callbackUrl=/admin");

  // TODO: Verify Super Admin role from database
  // For now, any authenticated user can access

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
