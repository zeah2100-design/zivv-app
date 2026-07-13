// Master-only: ban or unban users
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!me.isMaster) return Response.json({ error: "master only" }, { status: 403 });

  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

    // Ban by prepending [BANNED] to bio
    const target = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (target.length === 0) return Response.json({ error: "user not found" }, { status: 404 });
    if (target[0].isMaster) return Response.json({ error: "cannot ban master" }, { status: 400 });

    const newBio = `[BANNED] ${target[0].bio || ""}`.trim();
    await db.update(users).set({ bio: newBio }).where(eq(users.id, userId));

    return Response.json({ ok: true, banned: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!me.isMaster) return Response.json({ error: "master only" }, { status: 403 });

  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

    const target = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (target.length === 0) return Response.json({ error: "user not found" }, { status: 404 });

    // Unban: remove [BANNED] prefix
    const newBio = (target[0].bio || "").replace(/^\[BANNED\]\s*/, "").trim();
    await db.update(users).set({ bio: newBio || "" }).where(eq(users.id, userId));

    return Response.json({ ok: true, banned: false });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}
