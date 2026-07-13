// Master-only: list all users and banned users
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { eq, ne, desc, sql } from "drizzle-orm";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!me.isMaster) return Response.json({ error: "master only" }, { status: 403 });

  try {
    const allUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        avatarColor: users.avatarColor,
        isMaster: users.isMaster,
        isGolden: users.isGolden,
        createdAt: users.createdAt,
        lastSeen: users.lastSeen,
      })
      .from(users)
      .where(ne(users.id, me.id))
      .orderBy(desc(users.createdAt))
      .limit(100);

    // For banned users, we use a simple flag in bio
    const allWithBan = allUsers.map((u) => ({
      ...u,
      isBanned: (u as { bio?: string }).bio?.startsWith("[BANNED]") || false,
    }));

    return Response.json({
      users: allWithBan.filter((u) => !u.isBanned),
      banned: allWithBan.filter((u) => u.isBanned),
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}
