import { NextRequest } from "next/server";
import { db } from "@/db";
import { posts, comments, users, likes } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const postId = parseInt(id, 10);

  const postRows = await db
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
    .where(eq(posts.id, postId))
    .limit(1);

  if (postRows.length === 0) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  // increment view count
  await db
    .update(posts)
    .set({ views: sql`${posts.views} + 1` })
    .where(eq(posts.id, postId));

  const commentRows = await db
    .select({
      id: comments.id,
      content: comments.content,
      isAi: comments.isAi,
      createdAt: comments.createdAt,
      authorId: users.id,
      authorFirst: users.firstName,
      authorLast: users.lastName,
      authorColor: users.avatarColor,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
    .limit(50);

  return Response.json({ post: postRows[0], comments: commentRows });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const postId = parseInt(id, 10);
  const body = await req.json();
  const action = body.action as "like" | "comment";

  if (action === "like") {
    // toggle
    const existing = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, user.id)))
      .limit(1);
    if (existing.length > 0) {
      await db.delete(likes).where(eq(likes.id, existing[0].id));
      await db
        .update(posts)
        .set({ likes: sql`GREATEST(${posts.likes} - 1, 0)` })
        .where(eq(posts.id, postId));
      return Response.json({ ok: true, liked: false });
    } else {
      await db.insert(likes).values({ postId, userId: user.id });
      await db
        .update(posts)
        .set({ likes: sql`${posts.likes} + 1` })
        .where(eq(posts.id, postId));
      return Response.json({ ok: true, liked: true });
    }
  }

  if (action === "comment") {
    const content = String(body.content || "").trim();
    const isAi = !!body.isAi;
    if (!content) {
      return Response.json({ error: "التعليق فارغ" }, { status: 400 });
    }
    await db.insert(comments).values({ postId, userId: user.id, content, isAi });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
