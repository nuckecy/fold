import { redirect } from "next/navigation";

export default function Home() {
  // Default entry point — redirect to capture (mobile-first)
  redirect("/capture");
}
