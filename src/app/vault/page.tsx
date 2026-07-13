import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { VaultPage } from "@/components/VaultPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <VaultPage user={user} />;
}
