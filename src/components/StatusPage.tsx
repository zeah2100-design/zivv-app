"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import type { User } from "@/db/schema";
type SafeUser = Omit<User, "passwordHash">;

type Status = {
  id: number;
  userId: number;
  content: string;
  backgroundColor: string;
  expiresAt: string;
  createdAt: string;
  authorFirst: string;
  authorLast: string;
  authorColor: string | null;
};

const GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-cyan-500",
  "from-indigo-500 to-purple-500",
];

export function StatusPage({ user }: { user: SafeUser }) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [content, setContent] = useState("");
  const [bg, setBg] = useState(GRADIENTS[0]);
  const [viewing, setViewing] = useState<Status | null>(null);
  const [progress, setProgress] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/statuses", { cache: "no-store" });
    const data = await res.json();
    setStatuses(data.statuses || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function publish() {
    if (!content.trim()) return;
    await fetch("/api/statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, backgroundColor: bg }),
    });
    setContent("");
    load();
  }

  useEffect(() => {
    if (!viewing) return;
    setProgress(0);
    const total = 5000;
    const step = 100;
    const i = setInterval(() => {
      setProgress((p) => {
        const next = p + (step / total) * 100;
        if (next >= 100) {
          clearInterval(i);
          setViewing(null);
        }
        return next;
      });
    }, step);
    return () => clearInterval(i);
  }, [viewing]);

  // Group statuses by user
  const byUser = new Map<number, Status[]>();
  statuses.forEach((s) => {
    if (!byUser.has(s.userId)) byUser.set(s.userId, []);
    byUser.get(s.userId)!.push(s);
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">🌟 الحالات</h1>
        <p className="mt-1 text-sm text-slate-400">
          تحديثات يومية مؤقتة تظهر للأصدقاء المقبولين فقط — تنتهي خلال 24 ساعة
        </p>
      </header>

      <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">إنشاء حالة جديدة</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="بم تفكر اليوم؟"
              className="w-full resize-none rounded-2xl border border-white/10 bg-slate-800/50 p-3 text-slate-100 outline-none focus:border-violet-500"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GRADIENTS.map((g) => (
                <button
                  key={g}
                  onClick={() => setBg(g)}
                  className={`h-6 w-6 rounded-full bg-gradient-to-br ${g} ring-2 ${bg === g ? "ring-white" : "ring-transparent"}`}
                  aria-label="color"
                />
              ))}
            </div>
          </div>
          <div className={`flex aspect-square w-32 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${bg} p-2 text-center text-xs font-medium text-white`}>
            {content || "معاينة الحالة"}
          </div>
        </div>
        <button
          onClick={publish}
          disabled={!content.trim()}
          className="mt-3 rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          نشر الحالة
        </button>
      </div>

      <div className="space-y-3">
        {statuses.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
            لا توجد حالات من أصدقائك بعد.
          </p>
        ) : (
          Array.from(byUser.entries()).map(([uid, list]) => (
            <div key={uid} className="space-y-2">
              <p className="text-xs font-semibold text-slate-400">
                {list[0].authorFirst} {list[0].authorLast} · {list.length} حالة
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {list.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setViewing(s)}
                    className={`group relative aspect-[9/16] overflow-hidden rounded-2xl bg-gradient-to-br ${s.backgroundColor} text-xs text-white`}
                  >
                    <span className="absolute inset-0 grid place-items-center p-3 text-center text-sm font-semibold">
                      {s.content}
                    </span>
                    <span className="absolute bottom-1 right-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px]">
                      {formatTimeAgo(s.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {viewing && (
        <div
          ref={viewerRef}
          onClick={() => setViewing(null)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
        >
          <div className={`relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br ${viewing.backgroundColor} p-8 text-white shadow-2xl`}>
            <div className="absolute left-0 right-0 top-0 h-1 bg-white/30">
              <div className="h-full bg-white" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm font-semibold opacity-90">
              {viewing.authorFirst} {viewing.authorLast}
            </p>
            <p className="mt-6 text-2xl font-bold leading-relaxed">{viewing.content}</p>
            <p className="absolute bottom-4 left-0 right-0 text-center text-xs opacity-70">
              اضغط في أي مكان للإغلاق
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200">
        🔒 حالاتك وأصدقاؤك المقبولون فقط يمكنهم رؤية هذه التحديثات — لا يمكن للغرباء رؤيتها.
      </div>
    </div>
  );
}
