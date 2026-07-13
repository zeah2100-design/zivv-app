import { NextRequest } from "next/server";
import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { eq, and, or } from "drizzle-orm";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const chatId = parseInt(id, 10);

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.autoDisappear === "boolean") updates.autoDisappear = body.autoDisappear;
  if (typeof body.hideNotifications === "boolean") updates.hideNotifications = body.hideNotifications;

  await db.update(chats).set(updates).where(eq(chats.id, chatId));
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const chatId = parseInt(id, 10);

  // Verify membership
  const found = await db
    .select()
    .from(chats)
    .where(
      and(
        eq(chats.id, chatId),
        or(eq(chats.userAId, user.id), eq(chats.userBId, user.id))
      )
    )
    .limit(1);
  if (found.length === 0) return Response.json({ error: "not found" }, { status: 404 });

  // Delete messages first
  await db.delete(messages).where(eq(messages.chatId, chatId));
  // Delete chat
  await db.delete(chats).where(eq(chats.id, chatId));
  return Response.json({ ok: true });
}
