import { NextRequest } from "next/server";
import { db } from "@/db";
import { statuses, statusViews, friendships, users } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { eq, and, or, gt, desc, inArray, sql } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  // Find accepted friends
  const friends = await db
    .select({
      id: users.id,
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

  // Statuses from friends + self, not expired
  const now = new Date();
  const friendIds = [...friends.map((f) => f.id), user.id];

  const rows = await db
    .select({
      id: statuses.id,
      userId: statuses.userId,
      content: statuses.content,
      backgroundColor: statuses.backgroundColor,
      expiresAt: statuses.expiresAt,
      createdAt: statuses.createdAt,
      authorFirst: users.firstName,
      authorLast: users.lastName,
      authorColor: users.avatarColor,
    })
    .from(statuses)
    .innerJoin(users, eq(users.id, statuses.userId))
    .where(and(inArray(statuses.userId, friendIds), gt(statuses.expiresAt, now)))
    .orderBy(desc(statuses.createdAt))
    .limit(50);

  return Response.json({ statuses: rows, friends });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const content = String(body.content || "").trim();
  const backgroundColor = String(body.backgroundColor || "from-violet-500 to-fuchsia-500");
  if (!content) return Response.json({ error: "empty" }, { status: 400 });

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  await db.insert(statuses).values({ userId: user.id, content, backgroundColor, expiresAt });
  return Response.json({ ok: true });
}
