"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import type { User } from "@/db/schema";
import { ConfirmDialog } from "./ConfirmDialog";

type SafeUser = Omit<User, "passwordHash">;

type Chat = {
  id: number;
  userAId: number;
  userBId: number;
  visibility: "normal" | "vault";
  autoDisappear: boolean;
  hideNotifications: boolean;
  vaultPin: string | null;
};

type Message = {
  id: number;
  senderId: number;
  content: string;
  isAi: boolean;
  createdAt: string;
};

type Partner = { id: number; firstName: string; lastName: string; avatarColor: string };

export function ChatRoomPage({ chatId, currentUser }: { chatId: number; currentUser: SafeUser }) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [text, setText] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [auto, setAuto] = useState(false);
  const [hideNotif, setHideNotif] = useState(false);
  const [vaultPin, setVaultPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, { cache: "no-store" });
      if (!res.ok) { setChat(null); return; }
      const data = await res.json();
      setChat(data.chat);
      setMessages(data.messages || []);
      setAuto(!!data.chat.autoDisappear);
      setHideNotif(!!data.chat.hideNotifications);
      const listRes = await fetch("/api/chats", { cache: "no-store" });
      const listData = await listRes.json();
      const found = (listData.chats || []).find((c: Chat & { partner: Partner | null }) => c.id === chatId);
      if (found?.partner) setPartner(found.partner);
      if (data.chat.visibility === "vault" && data.chat.vaultPin) {
        setUnlocked(false);
      } else {
        setUnlocked(true);
      }
    } catch (err) {
      console.error("Load chat error:", err);
    }
  }, [chatId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!unlocked) return;
    pollRef.current = setInterval(() => load(), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [unlocked, load]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, aiTyping]);

  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true);
    const msgText = text;
    setText("");
    const tempId = -Date.now();
    setMessages((m) => [
      ...m,
      { id: tempId, senderId: currentUser.id, content: msgText, isAi: false, createdAt: new Date().toISOString() },
    ]);
    try {
      if (useAi) setAiTyping(true);
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgText, useAi }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessages((m) => m.filter((x) => x.id !== tempId));
        setText(msgText);
        setAiTyping(false);
        alert(data.error || "فشل إرسال الرسالة");
      } else {
        setAiTyping(false);
        await load();
      }
    } catch {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setText(msgText);
      setAiTyping(false);
    }
    setBusy(false);
  }

  function handleTextChange(v: string) {
    setText(v);
    // Show "typing" indicator for the other user
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (v.trim()) {
      setPartnerTyping(true);
      typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 1500);
    }
  }

  async function updateSettings() {
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoDisappear: auto, hideNotifications: hideNotif }),
      });
    } catch (err) { console.error("Update settings error:", err); }
  }

  async function deleteChat() {
    setBusy(true);
    try {
      await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      setShowDelete(false);
      window.location.href = "/chat";
    } catch (err) { setBusy(false); }
  }

  if (!chat) {
    return <div className="grid h-[60vh] place-items-center"><p className="text-slate-400">جاري التحميل...</p></div>;
  }

  if (chat.visibility === "vault" && !unlocked) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 fade-in">
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-rose-500/10 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-rose-500 text-4xl shadow-xl shadow-amber-500/30">🔒</div>
          <h2 className="mt-4 text-2xl font-bold text-white">دردشة مخفية</h2>
          <p className="mt-2 text-sm text-slate-300">أدخل رمز PIN للوصول</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (vaultPin === chat.vaultPin) setUnlocked(true);
            else setPinError("رمز PIN غير صحيح");
          }}
          className="rounded-3xl border border-white/5 bg-slate-900/70 p-6 space-y-4"
        >
          <input
            type="password"
            value={vaultPin}
            onChange={(e) => { setVaultPin(e.target.value); setPinError(null); }}
            placeholder="••••"
            dir="ltr"
            className="w-full rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-center text-2xl tracking-widest text-white outline-none focus:border-teal-500"
          />
          {pinError && <p className="text-center text-xs text-rose-300">{pinError}</p>}
          <button type="submit" className="w-full rounded-2xl bg-gradient-to-l from-amber-500 to-rose-500 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30">فتح الخزنة</button>
          <Link href="/chat" className="block text-center text-xs text-slate-400 hover:text-white">← العودة</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-rows-[auto_1fr_auto] overflow-hidden rounded-3xl border border-white/5 bg-slate-900/80 shadow-2xl backdrop-blur lg:h-[calc(100vh-3rem)] fade-in">
      <header className="flex items-center justify-between border-b border-white/5 bg-slate-900/60 p-4">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden">←</Link>
          <Link href={partner ? `/profile/${partner.id}` : "/chat"} className="flex items-center gap-3">
            <div className="relative">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${partner?.avatarColor || "from-teal-500 to-cyan-500"} text-sm font-bold text-white shadow-lg`}>
                {partner?.firstName.charAt(0) || "?"}
              </div>
              {partnerOnline && <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-900" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{partner?.firstName} {partner?.lastName}</p>
              <p className={`text-[10px] font-medium ${partnerOnline ? "text-emerald-300" : "text-slate-500"}`}>
                {partnerTyping ? "يكتب الآن..." : partnerOnline ? "● متصل الآن" : "غير متصل"}
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-1.5">
          {chat.visibility === "vault" && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-semibold text-amber-200">🔒 مخفي</span>
          )}
          <button
            onClick={() => setShowDelete(true)}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
            title="حذف المحادثة"
          >
            🗑
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="space-y-2 overflow-y-auto bg-slate-950/40 p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="text-5xl">💬</p>
              <p className="mt-3 text-sm text-slate-400">لا توجد رسائل. ابدأ المحادثة!</p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.senderId === currentUser.id && !m.isAi;
            const isAi = m.isAi;
            const prev = messages[i - 1];
            const showAvatar = !mine && (!prev || prev.senderId !== m.senderId || (Date.now() - new Date(prev.createdAt).getTime() > 60000));
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[80%] gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  {!mine && (
                    <div className={`h-7 w-7 shrink-0 ${showAvatar ? "" : "invisible"}`}>
                      {isAi ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-xs">✨</div>
                      ) : (
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${partner?.avatarColor || "from-emerald-500 to-teal-500"} text-[10px] font-bold text-white`}>
                          {partner?.firstName.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                      mine
                        ? "rounded-tr-md bg-gradient-to-l from-teal-600 to-cyan-600 text-white"
                        : isAi
                        ? "rounded-tl-md bg-white/[0.06] text-slate-100 ring-1 ring-teal-500/30"
                        : "rounded-tl-md bg-white/[0.04] text-slate-100"
                    }`}
                  >
                    {isAi && <p className="mb-0.5 text-[10px] font-semibold text-teal-300">✨ MiniMax</p>}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-slate-500"}`}>
                      {formatTimeAgo(m.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {aiTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-teal-500/30">
              <span className="text-[10px] text-teal-300">✨ MiniMax يكتب</span>
              <span className="flex gap-1">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-teal-400"></span>
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-teal-400"></span>
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-teal-400"></span>
              </span>
            </div>
          </div>
        )}
        {partnerTyping && !aiTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] px-4 py-2 text-xs text-slate-400">
              <span className="flex gap-1">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400"></span>
              </span>
              <span>يكتب الآن...</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 bg-slate-900/60 p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-slate-300 hover:bg-white/10">
            <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} className="rounded" />
            ✨ MiniMax
          </label>
          {chat.visibility === "vault" && (
            <>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-slate-300 hover:bg-white/10">
                <input type="checkbox" checked={auto} onChange={async (e) => { setAuto(e.target.checked); await updateSettings(); }} className="rounded" />
                ⏱ اختفاء تلقائي
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-slate-300 hover:bg-white/10">
                <input type="checkbox" checked={hideNotif} onChange={async (e) => { setHideNotif(e.target.checked); await updateSettings(); }} className="rounded" />
                🔕 صامتة
              </label>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="اكتب رسالة..."
            className="flex-1 rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-2.5 text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-500"
          />
          <button
            onClick={send}
            disabled={busy || !text.trim()}
            className="rounded-2xl bg-gradient-to-l from-teal-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 disabled:opacity-50"
          >
            ➤
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] font-medium text-emerald-300/80">🔐 رسائل حقيقية بين الطرفين · {messages.length} رسالة</p>
      </div>

      {showDelete && (
        <ConfirmDialog
          title="حذف المحادثة؟"
          message="سيتم حذف جميع الرسائل نهائياً."
          confirmLabel="حذف نهائي"
          variant="danger"
          onCancel={() => setShowDelete(false)}
          onConfirm={deleteChat}
        />
      )}
    </div>
  );
}
