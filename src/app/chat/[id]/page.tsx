import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/db/auth-server";
import { ChatRoomPage } from "@/components/ChatRoomPage";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) redirect("/");
  const { id } = await params;
  const chatId = parseInt(id, 10);
  if (isNaN(chatId)) notFound();
  return <ChatRoomPage chatId={chatId} currentUser={me} />;
}
