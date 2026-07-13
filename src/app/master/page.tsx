import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MasterPanel } from "@/components/MasterPanel";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  // Check if user is master
  const masterCheck = await db
    .select({ isMaster: users.isMaster })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return <MasterPanel user={user} isMaster={masterCheck[0]?.isMaster ?? false} />;
}
