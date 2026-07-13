// First-time master account setup
// Only ONE master can exist in the entire system
// First person to register as master becomes the founder

import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, subscriptionRequests } from "@/db/schema";
import { makePasswordHash, createSession } from "@/db/auth-server";
import { eq, sql } from "drizzle-orm";

// Birth date: 9 September 2010
const MASTER_BIRTH_DATE = "2010-09-09";
// Full legal name: زياد احمد صبحي
const MASTER_FULL_NAME = "زياد احمد صبحي";
// Master password: ذمرور
const MASTER_PASSWORD = "ذمرور";

export async function GET() {
  try {
    // Check if any master already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isMaster, true))
      .limit(1);

    return Response.json({
      hasMaster: existing.length > 0,
    });
  } catch (err) {
    return Response.json({ hasMaster: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, age, password, identifier } = body;

    // Check if master already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isMaster, true))
      .limit(1);

    if (existing.length > 0) {
      return Response.json(
        { error: "⛔ الحساب الرئيسي موجود بالفعل. لا يمكن إنشاء أكثر من حساب رئيسي." },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!firstName || !lastName || !age || !password) {
      return Response.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    if (parseInt(age, 10) < 18) {
      return Response.json({ error: "يجب أن يكون عمرك 18+" }, { status: 400 });
    }

    // Create the master account
    const passwordHash = makePasswordHash(password);
    const masterPasswordHash = makePasswordHash(MASTER_PASSWORD);
    const avatarColor = "from-amber-400 via-yellow-500 to-orange-500";

    const [master] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        age: parseInt(age, 10),
        passwordHash,
        email: identifier?.includes("@") ? identifier : null,
        phone: identifier && !identifier.includes("@") ? identifier : null,
        bio: "👑 الحساب الرئيسي لمؤسس zivv",
        avatarColor,
        isMaster: true,
        fullLegalName: MASTER_FULL_NAME,
        birthDate: MASTER_BIRTH_DATE,
        masterPasswordHash,
        isGolden: true,
        interests: ["leadership", "founder"],
      })
      .returning();

    await createSession(master.id);
    return Response.json({ ok: true, user: master });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "خطأ" },
      { status: 500 }
    );
  }
}
