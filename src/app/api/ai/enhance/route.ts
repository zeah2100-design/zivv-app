import { NextRequest } from "next/server";
import {
  xaiSuggestComment,
  xaiEnhanceText,
  xaiSearch,
  xaiChat,
  xaiWebSearch,
} from "@/lib/xai";
import { moderateContent } from "@/lib/ai";
import { getCurrentUser } from "@/db/auth-server";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = String(body.action || "");

  try {
    if (action === "enhance") {
      const text = String(body.text || "");
      const style = (body.style as "poetic" | "professional" | "friendly" | "short") || "poetic";
      const result = await xaiEnhanceText(text, style);
      return Response.json({ ok: true, result });
    }

    if (action === "suggest_comment") {
      const postContent = String(body.postContent || "");
      const result = postContent
        ? await xaiSuggestComment(postContent)
        : await xaiSuggestComment("منشور عام");
      return Response.json({ ok: true, result });
    }

    if (action === "search") {
      const query = String(body.query || "");
      const result = await xaiSearch(query);
      return Response.json({ ok: true, result });
    }

    if (action === "chat") {
      const message = String(body.message || "");
      const history = Array.isArray(body.history) ? body.history : [];
      const result = await xaiChat(message, history);
      return Response.json({ ok: true, result });
    }

    if (action === "moderate") {
      const result = moderateContent(String(body.text || ""), user.contentFilter ?? true);
      return Response.json(result);
    }



    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("AI API error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "AI error" },
      { status: 500 }
    );
  }
}
