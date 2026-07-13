import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

const SESSION_COOKIE = "zivv_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "_zivv_salt").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function makePasswordHash(password: string): string {
  return hashPassword(password);
}

export async function createSession(userId: number): Promise<string> {
  const id = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id, userId, expiresAt });

  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return id;
}

export async function destroySession() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (id) {
    await db.delete(sessions).where(eq(sessions.id, id));
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const now = new Date();
  const rows = await db
    .select({
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, now)))
    .limit(1);
  if (rows.length === 0) return null;
  // Update lastSeen (non-blocking, ignore failure)
  try {
    await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, rows[0].user.id));
  } catch {}
  // Strip passwordHash before returning to client
  const u = rows[0].user;
  const result = { ...u } as Record<string, unknown>;
  delete result.passwordHash;
  return result as typeof u;
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}
