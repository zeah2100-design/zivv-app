import { destroySession } from "@/db/auth-server";

export async function POST() {
  try {
    await destroySession();
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "logout failed" },
      { status: 500 }
    );
  }
}
