// Notifications API - real-time polling
import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const sinceId = parseInt(url.searchParams.get("sinceId") || "0", 10);

    // Get all notifications
    const all = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        link: notifications.link,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        fromUserId: users.id,
        fromFirstName: users.firstName,
        fromLastName: users.lastName,
        fromAvatarColor: users.avatarColor,
      })
      .from(notifications)
      .leftJoin(users, eq(users.id, notifications.fromUserId))
      .where(eq(notifications.userId, me.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const unreadCount = all.filter((n) => !n.isRead).length;

    return Response.json({ notifications: all, unreadCount });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { notificationIds } = body;

    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      for (const id of notificationIds) {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(and(eq(notifications.id, id), eq(notifications.userId, me.id)));
      }
    } else {
      // Mark all as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, me.id));
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    await db.delete(notifications).where(eq(notifications.userId, me.id));
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}
