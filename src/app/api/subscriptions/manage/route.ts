// Master approves/rejects subscription requests
import { NextRequest } from "next/server";
import { db } from "@/db";
import { subscriptionRequests, users, notifications, userPerks } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (!user.isMaster) {
    return Response.json({ error: "فقط الحساب الرئيسي يمكنه إدارة الطلبات" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return Response.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return Response.json({ error: "إجراء غير صالح" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update the request
    await db
      .update(subscriptionRequests)
      .set({
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: user.id,
      })
      .where(eq(subscriptionRequests.id, requestId));

    // If approved, upgrade the user to golden
    if (action === "approve") {
      const req_record = await db
        .select()
        .from(subscriptionRequests)
        .where(eq(subscriptionRequests.id, requestId))
        .limit(1);
      if (req_record.length > 0) {
        await db
          .update(users)
          .set({ isGolden: true })
          .where(eq(users.id, req_record[0].requesterId));

        // Create perks for the new golden user
        await db
          .insert(userPerks)
          .values({ userId: req_record[0].requesterId })
          .onConflictDoNothing();

        // Send notification to the user
        await db.insert(notifications).values({
          userId: req_record[0].requesterId,
          type: "golden_approved",
          fromUserId: user.id,
          title: "🎉 تمت الموافقة على اشتراكك الذهبي!",
          body: "مرحباً بك في النسخة الذهبية! استمتع بميزات حصرية.",
          link: "/settings",
        });
      }
    } else if (action === "reject") {
      // Notify the user of rejection
      const req_record = await db
        .select()
        .from(subscriptionRequests)
        .where(eq(subscriptionRequests.id, requestId))
        .limit(1);
      if (req_record.length > 0) {
        await db.insert(notifications).values({
          userId: req_record[0].requesterId,
          type: "golden_rejected",
          fromUserId: user.id,
          title: "❌ تم رفض طلب اشتراكك الذهبي",
          body: "يمكنك إعادة المحاولة لاحقاً",
          link: "/master",
        });
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}
