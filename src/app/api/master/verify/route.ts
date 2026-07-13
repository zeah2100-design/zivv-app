// Master login verification using secret password
// Only the master can access golden subscription approval

import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, createSession } from "@/db/auth-server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, secretPassword } = body;

    if (!firstName || !lastName || !secretPassword) {
      return Response.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // Find the master account
    const found = await db
      .select()
      .from(users)
      .where(eq(users.isMaster, true))
      .limit(1);

    if (found.length === 0) {
      return Response.json({ error: "لا يوجد حساب رئيسي" }, { status: 404 });
    }

    const master = found[0];

    if (master.firstName !== firstName || master.lastName !== lastName) {
      return Response.json({ error: "الاسم غير مطابق للحساب الرئيسي" }, { status: 401 });
    }

    // Verify the secret master password (stored as hash on signup)
    if (!master.masterPasswordHash || !verifyPassword(secretPassword, master.masterPasswordHash)) {
      return Response.json({ error: "كلمة السر السرية غير صحيحة" }, { status: 401 });
    }

    await createSession(master.id);
    return Response.json({ ok: true, user: master });
  } catch (err) {
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}
