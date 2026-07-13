// User perks API - golden subscription features
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, userPerks } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { eq } from "drizzle-orm";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    if (!me.isGolden) {
      return Response.json({
        isGolden: false,
        perks: null,
      });
    }

    // Get or create perks
    let perks = await db
      .select()
      .from(userPerks)
      .where(eq(userPerks.userId, me.id))
      .limit(1);

    if (perks.length === 0) {
      const [created] = await db
        .insert(userPerks)
        .values({ userId: me.id })
        .returning();
      perks = [created];
    }

    return Response.json({ isGolden: true, perks: perks[0] });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (!me.isGolden) {
    return Response.json({ error: "النسخة الذهبية مطلوبة لهذه الميزة" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    for (const key of ["customAvatar", "verifiedBadge", "unlimitedStorage", "customThemes", "prioritySupport", "noAds", "advancedAnalytics", "unlimitedFriends", "chatThemes", "customStatusDuration"]) {
      if (typeof body[key] === "boolean") updates[key] = body[key];
    }
    updates.updatedAt = new Date();

    await db
      .update(userPerks)
      .set(updates)
      .where(eq(userPerks.userId, me.id));

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}
