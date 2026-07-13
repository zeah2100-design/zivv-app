import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { makePasswordHash, createSession } from "@/db/auth-server";
import { pickAvatarColor } from "@/lib/utils";

function detectIdentifier(id: string): "email" | "phone" | null {
  const v = id.trim();
  if (!v) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "email";
  const cleaned = v.replace(/[\s\-()]/g, "");
  if (/^\+?\d{8,15}$/.test(cleaned)) return "phone";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const age = parseInt(String(body.age || ""), 10);
    const password = String(body.password || "");
    const identifier = String(body.identifier || "").trim();
    const interests: string[] = Array.isArray(body.interests) ? body.interests : [];

    if (!firstName || !lastName) {
      return Response.json({ error: "الاسم الأول واسم العائلة مطلوبان" }, { status: 400 });
    }
    if (isNaN(age) || age < 1) {
      return Response.json({ error: "العمر غير صالح" }, { status: 400 });
    }
    if (age < 18) {
      // First user is exempt (becomes master)
      const existing = await db.select({ id: users.id }).from(users).limit(1);
      if (existing.length > 0) {
        return Response.json(
          { error: "⛔ يجب أن يكون عمرك 18+ لاستخدام zivv." },
          { status: 403 }
        );
      }
    }
    if (!password || password.length < 4) {
      return Response.json({ error: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" }, { status: 400 });
    }

    // Email/phone is OPTIONAL (for account recovery)
    let email: string | null = null;
    let phone: string | null = null;
    if (identifier) {
      const kind = detectIdentifier(identifier);
      if (!kind) {
        return Response.json(
          { error: "الرجاء إدخال بريد إلكتروني صالح أو رقم هاتف دولي (أو اتركه فارغاً)" },
          { status: 400 }
        );
      }
      if (kind === "email") email = identifier;
      else phone = identifier;

      // Check duplicate
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(email ? eq(users.email, email) : eq(users.phone, phone!))
        .limit(1);
      if (existing.length > 0) {
        return Response.json(
          { error: "هذا البريد/الرقم مربوط بحساب آخر." },
          { status: 409 }
        );
      }
    }

    // Check if there's already a user with same first+last name (warn but allow)
    const sameName = await db
      .select()
      .from(users)
      .where(eq(users.firstName, firstName))
      .limit(20);
    const nameClash = sameName.find((u) => u.lastName === lastName);
    if (nameClash) {
      // Append a number to last name to make unique? No - we just allow it
      // since we'll use email/phone for unique identification at login
    }

    const passwordHash = makePasswordHash(password);
    const avatarColor = pickAvatarColor(firstName + lastName);

    // Check if this is the FIRST user (becomes Master automatically)
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .limit(1);
    const isFirstUser = existingUsers.length === 0;

    const [created] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        age,
        email,
        phone,
        passwordHash,
        avatarColor,
        interests,
        isMaster: isFirstUser,
        isGolden: isFirstUser,
        fullLegalName: isFirstUser ? "زياد احمد صبحي" : null,
        birthDate: isFirstUser ? "2010-09-09" : null,
        masterPasswordHash: isFirstUser ? makePasswordHash("ذمرور") : null,
      })
      .returning();

    await createSession(created.id);
    return Response.json({ ok: true, user: created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return Response.json({ error: message }, { status: 500 });
  }
}
