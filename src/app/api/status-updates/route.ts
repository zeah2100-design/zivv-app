// Advanced status updates with text/image/video + text overlay
import { NextRequest } from "next/server";
import { db } from "@/db";
import { statusUpdates, statusUpdateViews, users, friendships } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { and, eq, gt, or, desc, sql } from "drizzle-orm";

const GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-cyan-500",
  "from-indigo-500 to-purple-500",
];

// Get all active statuses from friends + my own
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    // Get friend IDs
    const friendRows = await db
      .select()
      .from(friendships)
      .where(
        and(
          or(eq(friendships.requesterId, user.id), eq(friendships.addresseeId, user.id)),
          eq(friendships.status, "accepted")
        )
      );

    const friendIds = new Set<number>([user.id]);
    friendRows.forEach((f) => {
      friendIds.add(f.requesterId === user.id ? f.addresseeId : f.requesterId);
    });

    // Get active statuses
    const now = new Date();
    const statuses = await db
      .select({
        id: statusUpdates.id,
        userId: statusUpdates.userId,
        type: statusUpdates.type,
        content: statusUpdates.content,
        mediaUrl: statusUpdates.mediaUrl,
        backgroundColor: statusUpdates.backgroundColor,
        textColor: statusUpdates.textColor,
        textPosition: statusUpdates.textPosition,
        fontSize: statusUpdates.fontSize,
        fontFamily: statusUpdates.fontFamily,
        viewsCount: statusUpdates.viewsCount,
        expiresAt: statusUpdates.expiresAt,
        createdAt: statusUpdates.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarColor: users.avatarColor,
      })
      .from(statusUpdates)
      .innerJoin(users, eq(users.id, statusUpdates.userId))
      .where(
        and(
          sql`${statusUpdates.userId} IN (${sql.join(Array.from(friendIds).map((id) => sql`${id}`), sql`, `)})`,
          gt(statusUpdates.expiresAt, now)
        )
      )
      .orderBy(desc(statusUpdates.createdAt))
      .limit(50);

    return Response.json({ statuses });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}

// Create a new status
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      type,
      content,
      mediaUrl,
      backgroundColor,
      textColor,
      textPosition,
      fontSize,
      fontFamily,
    } = body;

    if (!type || !["text", "image", "video"].includes(type)) {
      return Response.json({ error: "نوع غير صالح" }, { status: 400 });
    }

    if (type === "text" && !content) {
      return Response.json({ error: "المحتوى مطلوب" }, { status: 400 });
    }

    if ((type === "image" || type === "video") && !mediaUrl) {
      return Response.json({ error: "الوسائط مطلوبة" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const [status] = await db
      .insert(statusUpdates)
      .values({
        userId: user.id,
        type,
        content: content || null,
        mediaUrl: mediaUrl || null,
        backgroundColor: backgroundColor || GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
        textColor: textColor || "white",
        textPosition: textPosition || "center",
        fontSize: fontSize || 24,
        fontFamily: fontFamily || "cairo",
        expiresAt,
      })
      .returning();

    return Response.json({ ok: true, status });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}
