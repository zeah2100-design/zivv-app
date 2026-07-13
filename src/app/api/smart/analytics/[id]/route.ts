import { NextRequest } from "next/server";
import { getCurrentUser } from "@/db/auth-server";
import { getPostAnalytics } from "@/lib/smartEngine";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) return Response.json({ error: "invalid id" }, { status: 400 });

  try {
    const analytics = await getPostAnalytics(postId, user.id);
    if (!analytics) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ analytics });
  } catch (err) {
    console.error("Analytics error:", err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}
