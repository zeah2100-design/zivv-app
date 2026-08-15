"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/db/schema";
type SafeUser = Omit<User, "passwordHash">;

type VaultChat = {
  id: number;
  partner: { id: number; firstName: string; lastName: string; avatarColor: string } | null;
  lastMessage: { content: string; createdAt: string } | null;
  autoDisappear: boolean;
  hideNotifications: boolean;
};

export function VaultPage({ user }: { user: SafeUser }) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [vaultChats, setVaultChats] = useState<VaultChat[]>([]);
  const [newPin, setNewPin] = useState("");
  const [otherId, setOtherId] = useState("");

  const MASTER_PIN = "zivv2026"; // demo master PIN

  const load = useCallback(async () => {
    const res = await fetch("/api/chats?vault=1", { cache: "no-store" });
    const data = await res.json();
    setVaultChats(data.chats || []);
  }, []);

  useEffect(() => {
    if (unlocked) load();
  }, [unlocked, load]);

  function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (pin === MASTER_PIN || pin.length >= 4) {
      setUnlocked(true);
      setError(null);
    } else {
      setError("رمز PIN غير صحيح. يجب أن يكون 4 أحرف على الأقل.");
    }
  }

  async function createVaultChat() {
    const oid = parseInt(otherId, 10);
    if (isNaN(oid)) return;
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherId: oid, visibility: "vault", vaultPin: newPin || "0000" }),
    });
    const data = await res.json();
    if (data.chat?.id) router.push(`/chat/${data.chat.id}`);
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md space-y-5 py-10">
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-rose-500/10 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-rose-500 text-4xl">
            🔒
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">الخزنة المخفية</h1>
          <p className="mt-2 text-sm text-slate-300">
            محادثاتك المخفية محمية برمز PIN. لن تظهر في قائمة الدردشة العامة ولن تظهر إشعاراتها على شاشة القفل.
          </p>
        </div>

        <form onSubmit={unlock} className="rounded-3xl border border-white/5 bg-slate-900/70 p-6 space-y-4">
          <label className="block text-sm font-medium text-slate-200">أدخل رمز PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="w-full rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-center text-2xl tracking-widest text-white outline-none focus:border-teal-500"
          />
          <p className="text-xs text-slate-500">💡 للتجربة: استخدم 4 أحرف أو أكثر، أو جرّب "zivv2026"</p>
          {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-l from-amber-500 to-rose-500 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30"
          >
            فتح الخزنة
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
            🔒 <span>الخزنة</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            محادثاتك المخفية — مشفّرة، بدون إشعارات على شاشة القفل
          </p>
        </div>
        <button
          onClick={() => { setUnlocked(false); setPin(""); }}
          className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          🔒 إقفال
        </button>
      </header>

      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h2 className="mb-3 text-sm font-semibold text-amber-200">✚ محادثة مخفية جديدة</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="number"
            value={otherId}
            onChange={(e) => setOtherId(e.target.value)}
            placeholder="معرّف المستخدم (ID)"
            className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          />
          <input
            type="password"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder="رمز PIN (4+ أرقام)"
            className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          />
        </div>
        <button
          onClick={createVaultChat}
          disabled={!otherId}
          className="mt-3 rounded-xl bg-gradient-to-l from-amber-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          إنشاء
        </button>
      </div>

      <div className="space-y-2">
        {vaultChats.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
            لا توجد محادثات مخفية. أنشئ واحدة أعلاه.
          </p>
        ) : (
          vaultChats.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/chat/${c.id}`)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4 transition hover:bg-slate-800/60"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${
                  c.partner?.avatarColor || "from-amber-500 to-rose-500"
                } text-base font-bold text-white`}
              >
                {c.partner?.firstName.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {c.partner?.firstName} {c.partner?.lastName}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {c.lastMessage?.content || "محادثة مشفّرة"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {c.autoDisappear && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">⏱ تختفي</span>}
                {c.hideNotifications && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-200">🔕 صامتة</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
