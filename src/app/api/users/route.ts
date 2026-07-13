import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { ne, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  if (!q) return Response.json({ users: [] });
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarColor: users.avatarColor,
    })
    .from(users)
    .where(
      sql`(${users.firstName} ILIKE ${"%" + q + "%"} OR ${users.lastName} ILIKE ${"%" + q + "%"}) AND ${users.id} <> ${me.id}`
    )
    .limit(20);
  return Response.json({ users: rows });
}
