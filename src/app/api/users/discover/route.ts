import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, friendships } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { ne, sql, or, eq, and } from "drizzle-orm";

// GET /api/users/discover?q=search
export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";

  // Get all users except me + their friendship status with me
  const all = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarColor: users.avatarColor,
      bio: users.bio,
    })
    .from(users)
    .where(ne(users.id, me.id))
    .limit(50);

  const relations = await db
    .select()
    .from(friendships)
    .where(
      or(eq(friendships.requesterId, me.id), eq(friendships.addresseeId, me.id))
    );

  const enriched = all
    .map((u) => {
      const rel = relations.find(
        (r) => r.requesterId === u.id || r.addresseeId === u.id
      );
      let status: "none" | "pending_sent" | "pending_received" | "accepted" | "rejected" = "none";
      if (rel) {
        if (rel.status === "accepted") status = "accepted";
        else if (rel.status === "rejected") status = "rejected";
        else if (rel.status === "pending") {
          status = rel.requesterId === me.id ? "pending_sent" : "pending_received";
        }
      }
      return { ...u, status };
    })
    .filter((u) => {
      if (!q) return true;
      const t = q.toLowerCase();
      return (
        u.firstName.toLowerCase().includes(t) ||
        u.lastName.toLowerCase().includes(t)
      );
    });

  return Response.json({ users: enriched });
}
