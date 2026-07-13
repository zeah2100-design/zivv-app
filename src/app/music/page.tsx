import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { MusicPage } from "@/components/MusicPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <MusicPage />;
}
