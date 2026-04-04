import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CaptureShell } from "@/components/capture-shell";

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

  const initials = (session.user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <CaptureShell initials={initials}>
      {children}
    </CaptureShell>
  );
}
