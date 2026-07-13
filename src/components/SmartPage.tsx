"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { User } from "@/db/schema";
import { formatTimeAgo, AVATAR_PALETTE } from "@/lib/utils";
import { Logo } from "./Logo";

type SafeUser = Omit<User, "passwordHash">;

type Insight = {
  type: "suggestion" | "opportunity" | "achievement" | "warning" | "info";
  title: string;
  message: string;
  action?: { label: string; href: string };
  icon: string;
};

type Recommendation = {
  userId: number;
  firstName: string;
  lastName: string;
  avatarColor: string | null;
  reason: string;
  score: number;
  mutualFriends: number;
};

type SmartPost = {
  id: number;
  userId: number;
  content: string;
  mediaType: string;
  mediaUrl: string | null;
  musicName: string | null;
  tags: string[] | null;
  views: number;
  likes: number;
  createdAt: string;
  score: number;
  reason: string;
  authorFirst?: string;
  authorLast?: string;
  authorColor?: string | null;
};

const TYPE_STYLES: Record<Insight["type"], { bg: string; border: string; icon: string }> = {
  suggestion: { bg: "from-violet-500/10 to-fuchsia-500/5", border: "border-violet-500/20", icon: "💡" },
  opportunity: { bg: "from-amber-500/10 to-orange-500/5", border: "border-amber-500/20", icon: "🎯" },
  achievement: { bg: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-500/20", icon: "🏆" },
  warning: { bg: "from-rose-500/10 to-pink-500/5", border: "border-rose-500/20", icon: "⚠️" },
  info: { bg: "from-sky-500/10 to-cyan-500/5", border: "border-sky-500/20", icon: "ℹ️" },
};

export function SmartPage({ user }: { user: SafeUser }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [feed, setFeed] = useState<SmartPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "feed" | "discover">("overview");

  // Caption generator
  const [captionTopic, setCaptionTopic] = useState("");
  const [captions, setCaptions] = useState<string[]>([]);
  const [captionBusy, setCaptionBusy] = useState(false);

  // Tag generator
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagBusy, setTagBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [ins, rec, fd] = await Promise.all([
      fetch("/api/smart?type=insights").then((r) => r.json()),
      fetch("/api/smart?type=recommendations").then((r) => r.json()),
      fetch("/api/smart?type=feed&limit=10").then((r) => r.json()),
    ]);
    setInsights(ins.insights || []);
    setRecs(rec.recommendations || []);
    setFeed(fd.feed || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function generateCaptions() {
    if (!captionTopic.trim()) return;
    setCaptionBusy(true);
    try {
      const res = await fetch("/api/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "caption", topic: captionTopic }),
      });
      const data = await res.json();
      setCaptions(data.captions || []);
    } catch {}
    setCaptionBusy(false);
  }

  async function generateTags() {
    if (!tagInput.trim()) return;
    setTagBusy(true);
    try {
      const res = await fetch("/api/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tags", content: tagInput }),
      });
      const data = await res.json();
      setSuggestedTags(data.tags || []);
    } catch {}
    setTagBusy(false);
  }

  async function followRec(targetId: number) {
    await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-pink-600/20 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl shadow-xl shadow-violet-500/40">
            🧠
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              مرحباً بك في <span className="bg-gradient-to-l from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">الحل الذكي</span>
            </h1>
            <p className="mt-1 text-sm text-slate-300 sm:text-base">
              رؤى ذكية مخصصة لك · توصيات أصدقاء · محتوى مختار بناءً على اهتماماتك
            </p>
            <p className="mt-2 text-xs text-slate-500">
              مدعوم بواسطة zivv.AI
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl bg-white/5 p-1 text-sm">
        <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>
          📊 نظرة عامة
        </TabBtn>
        <TabBtn active={tab === "feed"} onClick={() => setTab("feed")}>
          🎯 تغذية ذكية
        </TabBtn>
        <TabBtn active={tab === "discover"} onClick={() => setTab("discover")}>
          🧰 أدوات ذكية
        </TabBtn>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : tab === "overview" ? (
        <div className="space-y-6">
          {/* Insights */}
          {insights.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-8 text-center">
              <p className="text-3xl">📊</p>
              <p className="mt-2 text-slate-300">لا توجد رؤى حالياً</p>
              <p className="mt-1 text-sm text-slate-500">انشر وتفاعل أكثر للحصول على رؤى ذكية</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.map((ins, i) => {
                const style = TYPE_STYLES[ins.type];
                return (
                  <div
                    key={i}
                    className={`rounded-3xl border bg-gradient-to-br ${style.bg} ${style.border} p-5 backdrop-blur`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/5 text-xl">
                        {ins.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-white">{ins.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">{ins.message}</p>
                        {ins.action && (
                          <Link
                            href={ins.action.href}
                            className="mt-3 inline-block rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                          >
                            {ins.action.label} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Friend Recommendations */}
          {recs.length > 0 && (
            <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                <span>👥</span> أشخاص قد تعرفهم
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {recs.slice(0, 6).map((r) => (
                  <div key={r.userId} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
                    <Link href={`/profile/${r.userId}`} className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${r.avatarColor || "from-violet-500 to-fuchsia-500"} text-sm font-bold text-white`}
                      >
                        {r.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {r.firstName} {r.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400">{r.reason}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => followRec(r.userId)}
                      className="ms-auto rounded-xl bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/30"
                    >
                      + متابعة
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : tab === "feed" ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm text-violet-200">
            ✨ هذه التغذية مخصصة لك بناءً على اهتماماتك ونشاط أصدقائك وتفاعلاتك السابقة
          </div>
          {feed.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
              <p className="text-slate-400">لا توجد منشورات حالياً</p>
            </div>
          ) : (
            feed.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${p.authorColor || "from-violet-500 to-fuchsia-500"} text-sm font-bold text-white`}>
                      {p.authorFirst?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {p.authorFirst} {p.authorLast}
                      </p>
                      <p className="text-xs text-slate-500">{formatTimeAgo(p.createdAt)}</p>
                    </div>
                  </div>
                  {p.reason && (
                    <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-[10px] text-violet-200">
                      {p.reason}
                    </span>
                  )}
                </div>
                {p.content && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-100">{p.content}</p>}
                {p.tags && p.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">#{t}</span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-3 text-xs text-slate-400">
                  <span>❤️ {p.likes}</span>
                  <span>👁 {p.views}</span>
                  <span className="ms-auto">نقاط: {p.score.toFixed(0)}</span>
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Caption Generator */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
              <span>✍️</span> مولّد التعليقات الذكي
            </h2>
            <p className="mb-3 text-sm text-slate-400">أدخل موضوعاً واحصل على 3 أفكار لتعليقات جذابة</p>
            <div className="flex gap-2">
              <input
                value={captionTopic}
                onChange={(e) => setCaptionTopic(e.target.value)}
                placeholder="مثال: غروب الشمس، قهوة الصباح، سفر..."
                className="flex-1 rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-2.5 text-slate-100 outline-none focus:border-violet-500"
              />
              <button
                onClick={generateCaptions}
                disabled={!captionTopic.trim() || captionBusy}
                className="rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {captionBusy ? "⏳ جاري التحضير..." : "✨ توليد"}
              </button>
            </div>
            {captions.length > 0 && (
              <div className="mt-3 space-y-2">
                {captions.map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <p className="text-sm text-slate-100">{c}</p>
                    <button
                      onClick={() => navigator.clipboard?.writeText(c)}
                      className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/10"
                    >
                      📋 نسخ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tag Generator */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
              <span>#</span> مستخرج الوسوم الذكي
            </h2>
            <p className="mb-3 text-sm text-slate-400">ألصق نص منشورك وسنقترح وسوماً مناسبة</p>
            <textarea
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              rows={3}
              placeholder="ألصق نص منشورك هنا..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-slate-800/50 p-3 text-slate-100 outline-none focus:border-violet-500"
            />
            <button
              onClick={generateTags}
              disabled={!tagInput.trim() || tagBusy}
              className="mt-2 w-full rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {tagBusy ? "⏳ جاري التحضير..." : "✨ استخراج الوسوم"}
            </button>
            {suggestedTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedTags.map((t, i) => (
                  <span
                    key={i}
                    onClick={() => navigator.clipboard?.writeText("#" + t)}
                    className="cursor-pointer rounded-full bg-violet-500/20 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/30"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
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
        active ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white" : "text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
