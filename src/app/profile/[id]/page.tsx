import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { ProfilePage } from "@/components/ProfilePage";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) redirect("/");
  const { id } = await params;
  return <ProfilePage profileId={parseInt(id, 10)} currentUser={me} />;
}
