import { NextRequest } from "next/server";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { and, eq, or, ne, sql } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  // pending requests where I'm the addressee
  const incoming = await db
    .select({
      id: friendships.id,
      status: friendships.status,
      createdAt: friendships.createdAt,
      requesterId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarColor: users.avatarColor,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.requesterId))
    .where(
      and(eq(friendships.addresseeId, user.id), eq(friendships.status, "pending"))
    );

  // accepted friends
  const accepted = await db
    .select({
      id: friendships.id,
      status: friendships.status,
      createdAt: friendships.createdAt,
      friendId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarColor: users.avatarColor,
    })
    .from(friendships)
    .innerJoin(
      users,
      sql`${users.id} = CASE WHEN ${friendships.requesterId} = ${user.id} THEN ${friendships.addresseeId} ELSE ${friendships.requesterId} END`
    )
    .where(
      and(
        or(eq(friendships.requesterId, user.id), eq(friendships.addresseeId, user.id)),
        eq(friendships.status, "accepted")
      )
    );

  // suggestions: users not already friends
  const allUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarColor: users.avatarColor,
    })
    .from(users)
    .where(ne(users.id, user.id))
    .limit(30);

  const friendIds = new Set<number>();
  accepted.forEach((a) => friendIds.add(a.friendId));
  incoming.forEach((i) => friendIds.add(i.requesterId));

  const suggestions = allUsers.filter((u) => !friendIds.has(u.id)).slice(0, 10);

  return Response.json({ incoming, friends: accepted, suggestions });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const action = body.action as "request" | "accept" | "reject" | "remove";
  const targetId = parseInt(String(body.targetId), 10);

  if (action === "request") {
    if (targetId === user.id) {
      return Response.json({ error: "لا يمكنك إضافة نفسك" }, { status: 400 });
    }
    // check existing
    const existing = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, user.id),
            eq(friendships.addresseeId, targetId)
          ),
          and(
            eq(friendships.requesterId, targetId),
            eq(friendships.addresseeId, user.id)
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return Response.json({ error: "الطلب موجود مسبقاً" }, { status: 400 });
    }
    await db
      .insert(friendships)
      .values({ requesterId: user.id, addresseeId: targetId, status: "pending" });
    return Response.json({ ok: true });
  }

  if (action === "accept") {
    await db
      .update(friendships)
      .set({ status: "accepted" })
      .where(
        and(
          eq(friendships.requesterId, targetId),
          eq(friendships.addresseeId, user.id)
        )
      );
    return Response.json({ ok: true });
  }

  if (action === "reject" || action === "remove") {
    await db
      .delete(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, user.id),
            eq(friendships.addresseeId, targetId)
          ),
          and(
            eq(friendships.requesterId, targetId),
            eq(friendships.addresseeId, user.id)
          )
        )
      );
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
