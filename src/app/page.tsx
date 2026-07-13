import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { AuthScreen } from "@/components/AuthScreen";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/feed");
  return <AuthScreen />;
}
