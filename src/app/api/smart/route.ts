import { NextRequest } from "next/server";
import { getCurrentUser } from "@/db/auth-server";
import {
  getSmartInsights,
  getFriendRecommendations,
  getSmartFeed,
  generateSmartCaption,
  generateSmartTags,
} from "@/lib/smartEngine";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "insights";

  try {
    if (type === "insights") {
      const insights = await getSmartInsights(user.id);
      return Response.json({ insights });
    }
    if (type === "recommendations") {
      const recs = await getFriendRecommendations(user.id);
      return Response.json({ recommendations: recs });
    }
    if (type === "feed") {
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);
      const feed = await getSmartFeed(user.id, limit);
      return Response.json({ feed });
    }
    return Response.json({ error: "unknown type" }, { status: 400 });
  } catch (err) {
    console.error("Smart engine error:", err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = body.action;

  try {
    if (action === "caption") {
      const captions = await generateSmartCaption(body.imageBase64, body.topic);
      return Response.json({ ok: true, captions });
    }
    if (action === "tags") {
      const tags = await generateSmartTags(String(body.content || ""));
      return Response.json({ ok: true, tags });
    }
    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Smart action error:", err);
    return Response.json({ error: "خطأ" }, { status: 500 });
  }
}
