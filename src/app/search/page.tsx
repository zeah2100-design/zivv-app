import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { SearchPage } from "@/components/SearchPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <SearchPage />;
}
