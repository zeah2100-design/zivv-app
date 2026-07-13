import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { SmartPage } from "@/components/SmartPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <SmartPage user={user} />;
}
