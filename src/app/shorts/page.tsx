import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { ShortsPage } from "@/components/ShortsPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <ShortsPage />;
}
