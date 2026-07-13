import { NextRequest } from "next/server";
import { db } from "@/db";
import { messages, chats } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { eq, and, or, asc, desc } from "drizzle-orm";
import { xaiChat } from "@/lib/xai";

async function assertMember(chatId: number, userId: number) {
  const rows = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);
  if (rows.length === 0) return null;
  const c = rows[0];
  if (c.userAId !== userId && c.userBId !== userId) return null;
  return c;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const chatId = parseInt(id, 10);
  const chat = await assertMember(chatId, user.id);
  if (!chat) return Response.json({ error: "not found" }, { status: 404 });

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt))
    .limit(200);

  return Response.json({ messages: rows, chat });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const chatId = parseInt(id, 10);
  const chat = await assertMember(chatId, user.id);
  if (!chat) return Response.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const content = String(body.content || "").trim();
  const useAi = !!body.useAi;
  if (!content) return Response.json({ error: "empty" }, { status: 400 });

  // Send user message
  await db.insert(messages).values({ chatId, senderId: user.id, content, isAi: false });

  // AI companion reply using xAI
  if (useAi) {
    const reply = await xaiChat(`رد بشكل مختصر وودود (جملة أو جملتين) على هذه الرسالة في محادثة: "${content}"`, []);
    await db.insert(messages).values({ chatId, senderId: user.id, content: reply, isAi: true });
  }

  await db.update(chats).set({ lastMessageAt: new Date() }).where(eq(chats.id, chatId));

  return Response.json({ ok: true });
}
