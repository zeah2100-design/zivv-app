import { NextRequest } from "next/server";
import { db } from "@/db";
import { musicLibrary } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const where = category ? eq(musicLibrary.category, category) : undefined;
  const rows = await db
    .select()
    .from(musicLibrary)
    .where(where)
    .orderBy(asc(musicLibrary.id));
  return Response.json({ tracks: rows });
}
