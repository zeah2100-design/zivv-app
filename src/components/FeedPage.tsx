"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import type { User } from "@/db/schema";
type SafeUser = Omit<User, "passwordHash">;

type PostRow = {
  id: number;
  content: string;
  mediaType: "text" | "image" | "video" | "short";
  mediaUrl: string | null;
  musicUrl: string | null;
  musicName: string | null;
  tags: string[] | null;
  views: number;
  likes: number;
  createdAt: string;
  authorId: number;
  authorFirst: string;
  authorLast: string;
  authorColor: string | null;
  commentCount: number;
};

const SAMPLE_GRADIENTS = [
  "from-violet-600 via-fuchsia-600 to-pink-500",
  "from-cyan-500 via-sky-500 to-blue-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-rose-500 via-pink-500 to-fuchsia-500",
  "from-indigo-600 via-violet-600 to-purple-600",
];

function pickGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return SAMPLE_GRADIENTS[Math.abs(h) % SAMPLE_GRADIENTS.length];
}

export function FeedPage({ user }: { user: SafeUser }) {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "text" | "image" | "video" | "short">(
    "all"
  );
  const [aiBusy, setAiBusy] = useState<number | null>(null);
  const [aiComment, setAiComment] = useState<{ postId: number; text: string } | null>(null);
  const [tts, setTts] = useState<{ postId: number; speaking: boolean } | null>(null);
  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/posts", { cache: "no-store" });
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function like(id: number) {
    await fetch(`/api/posts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });
    load();
  }

  async function aiSuggest(id: number, postContent?: string) {
    setAiBusy(id);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest_comment", postContent: postContent || "" }),
      });
      const data = await res.json();
      setAiBusy(null);
      setAiComment({ postId: id, text: data.result || "تعذّر إنشاء تعليق" });
    } catch {
      setAiBusy(null);
      setAiComment({ postId: id, text: "تعذّر الاتصال بـ AI" });
    }
  }

  async function submitAiComment() {
    if (!aiComment) return;
    await fetch(`/api/posts/${aiComment.postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", content: aiComment.text, isAi: true }),
    });
    setAiComment(null);
    load();
  }

  function speakToggle(post: PostRow) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (tts?.postId === post.id && tts.speaking) {
      window.speechSynthesis.cancel();
      setTts(null);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(post.content || "منشور من zivv");
    u.lang = "ar-SA";
    u.rate = 1;
    u.onend = () => setTts(null);
    ttsRef.current = u;
    window.speechSynthesis.speak(u);
    setTts({ postId: post.id, speaking: true });
  }

  const visible = filter === "all" ? posts : posts.filter((p) => p.mediaType === filter);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">الصفحة الرئيسية</h1>
          <p className="mt-1 text-sm text-slate-400">
            أهلاً {user.firstName} 👋 · منشورات مخصصة حسب اهتماماتك
          </p>
        </div>
        <Link
          href="/post"
          className="rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-fuchsia-500"
        >
          ✚ منشور جديد
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          { k: "all", l: "الكل" },
          { k: "text", l: "📝 نصوص" },
          { k: "image", l: "🖼️ صور" },
          { k: "video", l: "🎬 فيديو" },
          { k: "short", l: "▶️ قصير" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k as typeof filter)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              filter === (f.k as typeof filter)
                ? "bg-violet-500/30 text-violet-100 ring-1 ring-violet-400/50"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
          <p className="text-lg text-slate-300">لا توجد منشورات بعد 🌱</p>
          <p className="mt-1 text-sm text-slate-500">
            كن أول من يشارك شيئاً مميزاً مع المجتمع.
          </p>
          <Link
            href="/post"
            className="mt-4 inline-block rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
          >
            إنشاء منشور
          </Link>
        </div>
      ) : (
        visible.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-3xl border border-white/5 bg-slate-900/70 shadow-xl backdrop-blur"
          >
            <header className="flex items-center justify-between p-5">
              <Link
                href={`/profile/${post.authorId}`}
                className="flex items-center gap-3"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${
                    post.authorColor || "from-violet-500 to-fuchsia-500"
                  } text-sm font-bold text-white`}
                >
                  {post.authorFirst.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {post.authorFirst} {post.authorLast}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatTimeAgo(post.createdAt)}
                  </p>
                </div>
              </Link>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                {post.mediaType === "short" ? "▶️ Short" : post.mediaType === "image" ? "🖼️ صورة" : post.mediaType === "video" ? "🎬 فيديو" : "📝 نص"}
              </span>
            </header>

            {post.content && (
              <div className="px-5 pb-4">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">
                  {post.content}
                </p>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs text-violet-200"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {post.mediaType === "image" && post.mediaUrl && (
              <div className="px-5 pb-4">
                {post.mediaUrl.startsWith("data:image") || post.mediaUrl.startsWith("http") ? (
                  <img
                    src={post.mediaUrl}
                    alt=""
                    className="aspect-[16/9] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className={`aspect-[16/9] w-full rounded-2xl bg-gradient-to-br ${pickGradient(post.mediaUrl)}`} />
                )}
              </div>
            )}

            {post.mediaType === "video" && post.mediaUrl && (
              <div className="px-5 pb-4">
                {post.mediaUrl.startsWith("data:video") || post.mediaUrl.startsWith("http") ? (
                  <video
                    src={post.mediaUrl}
                    controls
                    className="aspect-video w-full rounded-2xl bg-black"
                  />
                ) : (
                  <div className={`flex aspect-video w-full items-center justify-center rounded-2xl bg-gradient-to-br ${pickGradient(String(post.id))}`}>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl text-white backdrop-blur">
                      ▶
                    </div>
                  </div>
                )}
              </div>
            )}

            {post.mediaType === "short" && post.mediaUrl && (
              <div className="px-5 pb-4">
                {post.mediaUrl.startsWith("data:video") || post.mediaUrl.startsWith("http") ? (
                  <Link href="/shorts" className="block w-full max-w-[260px]">
                    <video
                      src={post.mediaUrl}
                      muted
                      loop
                      playsInline
                      className="aspect-[9/14] w-full rounded-2xl object-cover"
                    />
                  </Link>
                ) : (
                  <Link
                    href="/shorts"
                    className={`flex aspect-[9/14] w-full max-w-[260px] items-end justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${pickGradient(String(post.id))} p-4 text-white`}
                  >
                    <span className="text-sm font-medium">▶ Short · اضغط للمشاهدة</span>
                  </Link>
                )}
              </div>
            )}

            {post.musicName && (
              <div className="mx-5 mb-4 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-300">
                🎵 {post.musicName}
              </div>
            )}

            <footer className="flex items-center gap-1 border-t border-white/5 px-3 py-2">
              <button
                onClick={() => like(post.id)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-rose-300"
              >
                <span>❤️</span> {post.likes}
              </button>
              <Link
                href={`/post/${post.id}`}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <span>💬</span> {post.commentCount}
              </Link>
              <button
                onClick={() => aiSuggest(post.id, post.content)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-violet-300 hover:bg-violet-500/10"
                title="تعليق ذكي"
              >
                ✨ {aiBusy === post.id ? "..." : "تعليق ذكي"}
              </button>
              <button
                onClick={() => speakToggle(post)}
                className="ms-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                title="استمع للمنشور"
              >
                {tts?.postId === post.id && tts.speaking ? "🔇 إيقاف" : "🔊 استمع"}
              </button>
              <span className="rounded-xl px-3 py-2 text-xs text-slate-500">
                👁 {post.views}
              </span>
            </footer>
          </article>
        ))
      )}

      {aiComment && (
        <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-full max-w-md rounded-3xl border border-violet-500/30 bg-slate-900/95 p-5 shadow-2xl backdrop-blur">
          <h3 className="text-sm font-semibold text-violet-200">✨ تعليق ذكي مقترح</h3>
          <p className="mt-2 text-sm text-slate-100">{aiComment.text}</p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setAiComment(null)}
              className="rounded-xl px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              إلغاء
            </button>
            <button
              onClick={submitAiComment}
              className="rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"
            >
              نشر التعليق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
