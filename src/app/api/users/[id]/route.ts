import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, ne, and, or } from "drizzle-orm";
import { getCurrentUser } from "@/db/auth-server";
import { friendships } from "@/db/schema";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const userId = parseInt(id, 10);

  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarColor: users.avatarColor,
      bio: users.bio,
      interests: users.interests,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (rows.length === 0) return Response.json({ error: "not found" }, { status: 404 });

  // friendship status between me and this user
  const fs = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, me.id), eq(friendships.addresseeId, userId)),
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, me.id))
      )
    )
    .limit(1);

  return Response.json({
    user: rows[0],
    friendship: fs[0] || null,
  });
}
