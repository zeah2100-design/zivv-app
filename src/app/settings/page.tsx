import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { SettingsPage } from "@/components/SettingsPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <SettingsPage user={user} />;
}
