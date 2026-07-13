import { NextRequest } from "next/server";
import { db } from "@/db";
import { friendships } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { and, eq, or } from "drizzle-orm";

// POST /api/friends/request { targetId }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const targetId = parseInt(String(body.targetId), 10);
  if (isNaN(targetId)) return Response.json({ error: "invalid target" }, { status: 400 });
  if (targetId === me.id) return Response.json({ error: "لا يمكنك إضافة نفسك" }, { status: 400 });

  // check existing
  const existing = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, me.id), eq(friendships.addresseeId, targetId)),
        and(eq(friendships.requesterId, targetId), eq(friendships.addresseeId, me.id))
      )
    )
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].status === "accepted") {
      return Response.json({ ok: true, alreadyFriends: true });
    }
    if (existing[0].status === "pending") {
      // If the other user requested me, auto-accept (mutual)
      if (existing[0].requesterId === targetId) {
        await db
          .update(friendships)
          .set({ status: "accepted" })
          .where(eq(friendships.id, existing[0].id));
        return Response.json({ ok: true, status: "accepted" });
      }
      return Response.json({ ok: true, alreadyPending: true });
    }
  }

  await db
    .insert(friendships)
    .values({ requesterId: me.id, addresseeId: targetId, status: "pending" });
  return Response.json({ ok: true, status: "pending" });
}
