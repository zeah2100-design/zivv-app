import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { PostDetailPage } from "@/components/PostDetailPage";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) notFound();
  return <PostDetailPage postId={postId} currentUser={user} />;
}
