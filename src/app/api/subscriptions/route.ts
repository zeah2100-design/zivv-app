// Subscription requests - users request golden, master approves
import { NextRequest } from "next/server";
import { db } from "@/db";
import { subscriptionRequests, users, notifications } from "@/db/schema";
import { getCurrentUser } from "@/db/auth-server";
import { and, desc, eq, or } from "drizzle-orm";

// Get subscription requests (master sees all, user sees own)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    if (user.isMaster) {
      // Master sees all requests
      const requests = await db
        .select({
          id: subscriptionRequests.id,
          status: subscriptionRequests.status,
          message: subscriptionRequests.message,
          createdAt: subscriptionRequests.createdAt,
          reviewedAt: subscriptionRequests.reviewedAt,
          requesterId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarColor: users.avatarColor,
          bio: users.bio,
        })
        .from(subscriptionRequests)
        .innerJoin(users, eq(users.id, subscriptionRequests.requesterId))
        .orderBy(desc(subscriptionRequests.createdAt))
        .limit(50);
      return Response.json({ requests, isMaster: true });
    } else {
      // User sees only own requests
      const requests = await db
        .select()
        .from(subscriptionRequests)
        .where(eq(subscriptionRequests.requesterId, user.id))
        .orderBy(desc(subscriptionRequests.createdAt))
        .limit(10);
      return Response.json({ requests, isMaster: false, isGolden: user.isGolden });
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}

// Create a new subscription request
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (user.isGolden) {
    return Response.json({ error: "أنت بالفعل مشترك ذهبي" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const message = String(body.message || "").trim();

    // Check if pending request already exists
    const existing = await db
      .select()
      .from(subscriptionRequests)
      .where(
        and(
          eq(subscriptionRequests.requesterId, user.id),
          eq(subscriptionRequests.status, "pending")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return Response.json({ error: "لديك طلب معلق بالفعل" }, { status: 400 });
    }

    // Find the master (only one)
    const master = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isMaster, true))
      .limit(1);

    const [req_record] = await db
      .insert(subscriptionRequests)
      .values({
        requesterId: user.id,
        masterId: master[0]?.id || null,
        message: message || "طلب اشتراك في النسخة الذهبية",
        status: "pending",
      })
      .returning();

    // Send notification to master
    if (master[0]) {
      await db.insert(notifications).values({
        userId: master[0].id,
        type: "golden_request",
        fromUserId: user.id,
        title: "⭐ طلب اشتراك ذهبي جديد",
        body: `${user.firstName} ${user.lastName} يطلب الاشتراك في النسخة الذهبية`,
        link: "/master",
      });
    }

    return Response.json({ ok: true, request: req_record });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}
