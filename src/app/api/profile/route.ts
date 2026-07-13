import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, makePasswordHash, verifyPassword } from "@/db/auth-server";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const updates: Partial<typeof users.$inferInsert> = {};

  if (body.firstName) updates.firstName = String(body.firstName).trim();
  if (body.lastName) updates.lastName = String(body.lastName).trim();
  if (typeof body.bio === "string") updates.bio = body.bio;
  if (body.avatarColor) updates.avatarColor = String(body.avatarColor);
  if (Array.isArray(body.interests)) updates.interests = body.interests;
  if (body.theme) updates.theme = body.theme;
  if (typeof body.showOnline === "boolean") updates.showOnline = body.showOnline;
  if (typeof body.contentFilter === "boolean") updates.contentFilter = body.contentFilter;
  if (typeof body.parentalControl === "boolean") updates.parentalControl = body.parentalControl;

  if (body.newPassword) {
    if (!me.passwordHash || !body.currentPassword || !verifyPassword(String(body.currentPassword), me.passwordHash)) {
      return Response.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    }
    if (String(body.newPassword).length < 4) {
      return Response.json({ error: "كلمة المرور الجديدة قصيرة جداً" }, { status: 400 });
    }
    updates.passwordHash = makePasswordHash(String(body.newPassword));
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ ok: true });
  }

  await db.update(users).set(updates).where(eq(users.id, me.id));
  return Response.json({ ok: true });
}
