"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";

type Friend = {
  id: number;
  status: string;
  createdAt: string;
  friendId: number;
  firstName: string;
  lastName: string;
  avatarColor: string | null;
};

type Request = {
  id: number;
  status: string;
  createdAt: string;
  requesterId: number;
  firstName: string;
  lastName: string;
  avatarColor: string | null;
};

type Discover = {
  id: number;
  firstName: string;
  lastName: string;
  avatarColor: string | null;
  bio: string | null;
  status: "none" | "pending_sent" | "pending_received" | "accepted" | "rejected";
};

export function FriendsPage() {
  const [incoming, setIncoming] = useState<Request[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [discover, setDiscover] = useState<Discover[]>([]);
  const [tab, setTab] = useState<"incoming" | "list" | "discover">("incoming");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [toRemove, setToRemove] = useState<Friend | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [f, d] = await Promise.all([
      fetch("/api/friends", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/users/discover", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setIncoming(f.incoming || []);
    setFriends(f.friends || []);
    setDiscover(d.users || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  async function respond(targetId: number, action: "accept" | "reject") {
    setBusy(true);
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetId }),
    });
    setBusy(false);
    setToast(action === "accept" ? "✓ تم قبول الصداقة" : "تم رفض الطلب");
    load();
  }

  async function requestAdd(targetId: number) {
    setBusy(true);
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.alreadyFriends) setToast("✓ هو صديقك بالفعل");
    else if (data.status === "accepted") setToast("✓ تم قبول الصداقة فوراً");
    else if (data.alreadyPending) setToast("⏳ الطلب معلق");
    else setToast("✓ تم إرسال طلب الصداقة");
    load();
  }

  async function removeFriend(targetId: number) {
    setBusy(true);
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", targetId }),
    });
    setBusy(false);
    setToRemove(null);
    setToast("تمت إزالة الصديق");
    load();
  }

  const filteredDiscover = discover.filter((d) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return (
      d.firstName.toLowerCase().includes(t) ||
      d.lastName.toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">الأصدقاء</h1>
        <p className="mt-1 text-sm text-slate-400">
          إدارة طلبات الصداقة وقائمة أصدقائك
        </p>
      </header>

      <div className="flex gap-2 rounded-2xl bg-white/5 p-1 text-sm">
        <TabBtn active={tab === "incoming"} onClick={() => setTab("incoming")}>
          📬 الطلبات {incoming.length > 0 && <span className="ms-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{incoming.length}</span>}
        </TabBtn>
        <TabBtn active={tab === "list"} onClick={() => setTab("list")}>
          👥 أصدقائي ({friends.length})
        </TabBtn>
        <TabBtn active={tab === "discover"} onClick={() => setTab("discover")}>
          ✨ اكتشف أشخاص
        </TabBtn>
      </div>

      {tab === "incoming" && (
        <div className="space-y-2">
          {incoming.length === 0 ? (
            <EmptyState icon="📭" title="لا توجد طلبات صداقة" desc="عندما يطلب أحد صداقتك ستظهر هنا." />
          ) : (
            incoming.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4">
                <Link href={`/profile/${r.requesterId}`} className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${
                      r.avatarColor || "from-teal-500 to-cyan-500"
                    } text-base font-bold text-white`}
                  >
                    {r.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.firstName} {r.lastName}</p>
                    <p className="text-xs text-slate-400">يريد أن يكون صديقك · {formatTimeAgo(r.createdAt)}</p>
                  </div>
                </Link>
                <div className="ms-auto flex gap-2">
                  <button
                    onClick={() => respond(r.requesterId, "accept")}
                    disabled={busy}
                    className="rounded-xl bg-gradient-to-l from-teal-600 to-cyan-600 px-4 py-1.5 text-sm font-semibold text-white shadow disabled:opacity-50"
                  >
                    قبول
                  </button>
                  <button
                    onClick={() => respond(r.requesterId, "reject")}
                    disabled={busy}
                    className="rounded-xl bg-white/5 px-4 py-1.5 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50"
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "list" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {friends.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon="👥"
                title="لم تقبل أي صداقات بعد"
                desc="اذهب لتبويب 'اكتشف أشخاص' لإضافة أصدقاء جدد."
              />
            </div>
          ) : (
            friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4">
                <Link href={`/profile/${f.friendId}`} className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${
                      f.avatarColor || "from-emerald-500 to-teal-500"
                    } text-base font-bold text-white`}
                  >
                    {f.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.firstName} {f.lastName}</p>
                    <p className="text-xs text-emerald-300">✓ صديق منذ {formatTimeAgo(f.createdAt)}</p>
                  </div>
                </Link>
                <div className="ms-auto flex items-center gap-1">
                  <Link
                    href={`/chat?new=${f.friendId}`}
                    className="rounded-xl bg-teal-500/15 px-3 py-1.5 text-xs text-teal-200 hover:bg-teal-500/25"
                  >
                    💬 مراسلة
                  </Link>
                  <button
                    onClick={() => setToRemove(f)}
                    className="grid h-7 w-7 place-items-center rounded-xl text-rose-300 hover:bg-rose-500/15"
                    title="إزالة صديق"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "discover" && (
        <div className="space-y-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن أشخاص بالاسم..."
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 py-3 ps-10 pe-4 text-slate-100 outline-none focus:border-teal-500"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredDiscover.length === 0 ? (
              <div className="col-span-full">
                <EmptyState icon="🔍" title="لا نتائج" desc="جرّب البحث بكلمات مختلفة." />
              </div>
            ) : (
              filteredDiscover.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4">
                  <Link href={`/profile/${d.id}`} className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${
                        d.avatarColor || "from-amber-500 to-rose-500"
                      } text-base font-bold text-white`}
                    >
                      {d.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{d.firstName} {d.lastName}</p>
                      {d.bio && <p className="line-clamp-1 text-xs text-slate-400">{d.bio}</p>}
                    </div>
                  </Link>
                  <div className="ms-auto">
                    {d.status === "none" && (
                      <button
                        onClick={() => requestAdd(d.id)}
                        disabled={busy}
                        className="rounded-xl bg-gradient-to-l from-teal-600 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow disabled:opacity-50"
                      >
                        + إضافة
                      </button>
                    )}
                    {d.status === "pending_sent" && (
                      <span className="rounded-xl bg-white/5 px-3 py-1.5 text-xs text-slate-300">⏳ معلق</span>
                    )}
                    {d.status === "pending_received" && (
                      <Link
                        href="/friends"
                        onClick={() => setTab("incoming")}
                        className="rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/25"
                      >
                        ✓ يردّ عليك
                      </Link>
                    )}
                    {d.status === "accepted" && (
                      <span className="rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200">✓ صديق</span>
                    )}
                    {d.status === "rejected" && (
                      <span className="rounded-xl bg-white/5 px-3 py-1.5 text-xs text-slate-400">—</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {toRemove && (
        <ConfirmDialog
          title="إزالة صديق؟"
          message={`هل تريد إزالة ${toRemove.firstName} ${toRemove.lastName} من قائمة أصدقائك؟`}
          confirmLabel="إزالة"
          variant="danger"
          onCancel={() => setToRemove(null)}
          onConfirm={() => removeFriend(toRemove.friendId)}
        />
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-50 mx-auto w-fit rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-2.5 text-sm text-white shadow-2xl backdrop-blur lg:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 font-semibold transition ${
        active ? "bg-gradient-to-l from-teal-600 to-cyan-600 text-white shadow" : "text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
      <p className="text-4xl">{icon}</p>
      <p className="mt-3 text-slate-300">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}
