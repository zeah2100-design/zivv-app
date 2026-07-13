"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTimeAgo } from "@/lib/utils";

type Chat = {
  id: number;
  visibility: "normal" | "vault";
  userAId: number;
  userBId: number;
  lastMessageAt: string;
  partner: { id: number; firstName: string; lastName: string; avatarColor: string } | null;
  lastMessage: { content: string; createdAt: string } | null;
};

export function ChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/chats", { cache: "no-store" });
    const data = await res.json();
    setChats(data.chats || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function newChat() {
    const id = prompt("أدخل معرّف المستخدم (ID):");
    if (!id) return;
    const otherId = parseInt(id, 10);
    if (isNaN(otherId)) return;
    fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.chat?.id) router.push(`/chat/${d.chat.id}`);
      });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">الدردشة</h1>
          <p className="mt-1 text-sm text-slate-400">رسائل مشفّرة وآمنة</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/vault"
            className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            🔒 الخزنة
          </Link>
          <button
            onClick={newChat}
            className="rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"
          >
            ✚ محادثة جديدة
          </button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />)}
        </div>
      ) : chats.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
          <p className="text-4xl">💬</p>
          <p className="mt-3 text-slate-300">لا توجد محادثات بعد</p>
          <p className="mt-1 text-sm text-slate-500">ابدأ محادثة جديدة أو اذهب لملف صديق واضغط مراسلة.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {chats.map((c) => (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-3 transition hover:bg-slate-800/60"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${
                  c.partner?.avatarColor || "from-violet-500 to-fuchsia-500"
                } text-base font-bold text-white`}
              >
                {c.partner?.firstName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-semibold text-white">
                    {c.partner?.firstName} {c.partner?.lastName}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    {c.lastMessage ? formatTimeAgo(c.lastMessage.createdAt) : ""}
                  </span>
                </div>
                <p className="truncate text-xs text-slate-400">
                  {c.lastMessage?.content || "ابدأ المحادثة..."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
