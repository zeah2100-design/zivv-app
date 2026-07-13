"use client";

import { useState } from "react";
import Link from "next/link";

type User = { id: number; firstName: string; lastName: string; avatarColor: string | null };

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [aiMode, setAiMode] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function normalSearch(q: string) {
    if (!q.trim()) {
      setUsers([]);
      return;
    }
    const res = await fetch(`/api/users?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function aiSearch() {
    if (!query.trim()) return;
    setBusy(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", query }),
      });
      const data = await res.json();
      setAiResult(data.result || "لم أجد إجابة.");
    } catch {
      setAiResult("تعذّر الاتصال بـ AI");
    }
    setBusy(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (aiMode) {
      aiSearch();
    } else {
      normalSearch(query);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">البحث و AI Studio</h1>
        <p className="mt-1 text-sm text-slate-400">
          ابحث عن المستخدمين أو استفد من البحث الذكي الموثّق
        </p>
      </header>

      <form onSubmit={onSubmit} className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!aiMode) normalSearch(e.target.value);
            }}
            placeholder={aiMode ? "اسأل الذكاء الاصطناعي أي شيء..." : "ابحث عن أشخاص بالاسم..."}
            className="flex-1 rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-3 text-slate-100 outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
          >
            {busy ? "..." : "بحث"}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setAiMode(false); setAiResult(null); normalSearch(query); }}
            className={`rounded-full px-3 py-1 text-xs ${!aiMode ? "bg-violet-500/30 text-violet-200" : "bg-white/5 text-slate-300"}`}
          >
            🔍 بحث عادي
          </button>
          <button
            type="button"
            onClick={() => { setAiMode(true); setUsers([]); }}
            className={`rounded-full px-3 py-1 text-xs ${aiMode ? "bg-fuchsia-500/30 text-fuchsia-200" : "bg-white/5 text-slate-300"}`}
          >
            ✨ بحث ذكي
          </button>
        </div>
      </form>

      {aiMode ? (
        <div className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/5 to-violet-500/5 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            ✨ نتائج البحث الذكي
          </h2>
          {!aiResult ? (
            <p className="mt-3 text-sm text-slate-400">
              اكتب سؤالك أو موضوعك في الأعلى ثم اضغط بحث. سأقدم لك إجابات موثّقة من قاعدة معرفتي.
            </p>
          ) : (
            <div className="prose prose-invert mt-3 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
              {aiResult}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
            <span>جرّب:</span>
            {["الذكاء الاصطناعي", "موسيقى", "فضاء", "تعليم", "برمجة"].map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="rounded-full bg-white/5 px-3 py-1 hover:bg-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
              ابدأ بكتابة اسم للبحث عن مستخدمين.
            </p>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                href={`/profile/${u.id}`}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4 transition hover:bg-slate-800/60"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${
                    u.avatarColor || "from-violet-500 to-fuchsia-500"
                  } text-base font-bold text-white`}
                >
                  {u.firstName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-slate-400">@{u.firstName.toLowerCase()}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
