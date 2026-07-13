import { NextRequest } from "next/server";
import { db } from "@/db";
import { chats, users, messages } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { eq, or, and, sql, desc, ne } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const includeVault = url.searchParams.get("vault") === "1";

  const where = and(
    or(eq(chats.userAId, user.id), eq(chats.userBId, user.id)),
    includeVault ? eq(chats.visibility, "vault") : ne(chats.visibility, "vault")
  );

  const rows = await db
    .select({
      id: chats.id,
      userAId: chats.userAId,
      userBId: chats.userBId,
      visibility: chats.visibility,
      autoDisappear: chats.autoDisappear,
      lastMessageAt: chats.lastMessageAt,
    })
    .from(chats)
    .where(where)
    .orderBy(desc(chats.lastMessageAt));

  // attach partner info
  const partnerIds = rows.map((r) => (r.userAId === user.id ? r.userBId : r.userAId));
  let partnerMap = new Map<number, { id: number; firstName: string; lastName: string; avatarColor: string }>();
  if (partnerIds.length) {
    const us = await db.select().from(users);
    us.forEach((u) => {
      if (partnerIds.includes(u.id)) {
        partnerMap.set(u.id, {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          avatarColor: u.avatarColor || "violet",
        });
      }
    });
  }

  // attach last message (simple per-chat query)
  const lastMap = new Map<number, { content: string; createdAt: Date }>();
  if (rows.length) {
    for (const chat of rows) {
      const lastMsg = await db
        .select({
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.chatId, chat.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      if (lastMsg.length > 0) {
        lastMap.set(chat.id, { content: lastMsg[0].content, createdAt: lastMsg[0].createdAt });
      }
    }
  }

  return Response.json({
    chats: rows.map((r) => ({
      ...r,
      partner: partnerMap.get(r.userAId === user.id ? r.userBId : r.userAId) || null,
      lastMessage: lastMap.get(r.id) || null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const otherId = parseInt(String(body.otherId), 10);
  const visibility = (body.visibility as "normal" | "vault") || "normal";
  const vaultPin = body.vaultPin ? String(body.vaultPin) : null;

  if (otherId === user.id) {
    return Response.json({ error: "لا يمكنك مراسلة نفسك" }, { status: 400 });
  }

  // check existing
  const existing = await db
    .select()
    .from(chats)
    .where(
      or(
        and(eq(chats.userAId, user.id), eq(chats.userBId, otherId)),
        and(eq(chats.userAId, otherId), eq(chats.userBId, user.id))
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return Response.json({ ok: true, chat: existing[0] });
  }

  const [created] = await db
    .insert(chats)
    .values({
      userAId: user.id,
      userBId: otherId,
      visibility,
      vaultPin: visibility === "vault" ? vaultPin : null,
    })
    .returning();

  return Response.json({ ok: true, chat: created });
}
