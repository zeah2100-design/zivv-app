import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { verifyPassword, createSession } from "@/db/auth-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const password = String(body.password || "");

    if (!firstName || !lastName || !password) {
      return Response.json(
        { error: "الرجاء إدخال الاسم الكامل وكلمة المرور" },
        { status: 400 }
      );
    }

    // Find user by exact first + last name match
    const candidates = await db
      .select()
      .from(users)
      .where(eq(users.firstName, firstName))
      .limit(50);

    const match = candidates.find(
      (u) => u.lastName === lastName && u.passwordHash && verifyPassword(password, u.passwordHash)
    );

    if (!match) {
      return Response.json(
        { error: "❌ الاسم أو كلمة المرور غير صحيحة. تأكد من البيانات." },
        { status: 401 }
      );
    }

    if (match.age < 18 && !match.isMaster) {
      return Response.json({ error: "هذا الحساب مقيّد بسبب العمر." }, { status: 403 });
    }

    await createSession(match.id);
    return Response.json({ ok: true, user: match });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return Response.json({ error: message }, { status: 500 });
  }
}
