import { NextRequest } from "next/server";
import { db } from "@/db";
import { posts, users, comments } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { moderateContent } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const userIdParam = url.searchParams.get("userId");
  const type = url.searchParams.get("type"); // 'short' for shorts

  let baseQuery = db
    .select({
      id: posts.id,
      content: posts.content,
      mediaType: posts.mediaType,
      mediaUrl: posts.mediaUrl,
      musicUrl: posts.musicUrl,
      musicName: posts.musicName,
      tags: posts.tags,
      views: posts.views,
      likes: posts.likes,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorFirst: users.firstName,
      authorLast: users.lastName,
      authorColor: users.avatarColor,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .orderBy(desc(posts.createdAt))
    .limit(50);

  if (userIdParam) {
    baseQuery = baseQuery.where(eq(posts.userId, parseInt(userIdParam, 10))) as typeof baseQuery;
  } else if (type === "short") {
    baseQuery = baseQuery.where(eq(posts.mediaType, "short")) as typeof baseQuery;
  }

  const rows = await baseQuery;

  // attach comment counts
  const ids = rows.map((r) => r.id);
  let countMap = new Map<number, number>();
  if (ids.length) {
    const counts = await db
      .select({
        postId: comments.postId,
        c: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(inArray(comments.postId, ids))
      .groupBy(comments.postId);
    counts.forEach((c) => countMap.set(c.postId, c.c));
  }

  return Response.json({
    posts: rows.map((r) => ({ ...r, commentCount: countMap.get(r.id) || 0 })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const content = String(body.content || "").trim();
  const mediaType = (body.mediaType as "text" | "image" | "video" | "short") || "text";
  const mediaUrl = body.mediaUrl ? String(body.mediaUrl) : null;
  const musicUrl = body.musicUrl ? String(body.musicUrl) : null;
  const musicName = body.musicName ? String(body.musicName) : null;
  const tags: string[] = Array.isArray(body.tags) ? body.tags : [];

  if (!content && !mediaUrl) {
    return Response.json({ error: "لا يمكن إنشاء منشور فارغ" }, { status: 400 });
  }

  const moderation = moderateContent(content, user.contentFilter ?? true);
  if (!moderation.ok) {
    return Response.json({ error: moderation.reason }, { status: 400 });
  }

  const [created] = await db
    .insert(posts)
    .values({ userId: user.id, content, mediaType, mediaUrl, musicUrl, musicName, tags })
    .returning();

  return Response.json({ ok: true, post: created });
}
