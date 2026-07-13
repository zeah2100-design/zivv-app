import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { db } from "@/db";
import { userPerks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PerksPage } from "@/components/PerksPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  let perks = null;
  if (user.isGolden) {
    const found = await db
      .select()
      .from(userPerks)
      .where(eq(userPerks.userId, user.id))
      .limit(1);
    perks = found[0] || null;
  }

  return <PerksPage user={user} perks={perks} />;
}
