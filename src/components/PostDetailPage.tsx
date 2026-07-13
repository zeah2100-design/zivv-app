"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTimeAgo } from "@/lib/utils";
import type { User } from "@/db/schema";
type SafeUser = Omit<User, "passwordHash">;

type Post = {
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
};

type Comment = {
  id: number;
  content: string;
  isAi: boolean;
  createdAt: string;
  authorId: number;
  authorFirst: string;
  authorLast: string;
  authorColor: string | null;
};

export function PostDetailPage({ postId, currentUser }: { postId: number; currentUser: SafeUser }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [liked, setLiked] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/posts/${postId}`, { cache: "no-store" });
    if (!res.ok) {
      router.push("/feed");
      return;
    }
    const data = await res.json();
    setPost(data.post);
    setComments(data.comments || []);
  }, [postId, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function send() {
    if (!text.trim()) return;
    await fetch(`/api/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", content: text }),
    });
    setText("");
    load();
  }

  async function aiSuggest() {
    setAiBusy(true);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest_comment", postContent: post?.content || "" }),
      });
      const data = await res.json();
      setAiBusy(false);
      setText(data.result || "تعذّر إنشاء تعليق");
    } catch {
      setAiBusy(false);
      setText("تعذّر الاتصال بـ AI");
    }
  }

  async function like() {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });
    const data = await res.json();
    setLiked(!!data.liked);
    load();
  }

  if (!post) {
    return <div className="animate-pulse space-y-4"><div className="h-40 rounded-3xl bg-white/5" /></div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/feed" className="text-sm text-slate-400 hover:text-white">
        ← العودة للرئيسية
      </Link>
      <article className="overflow-hidden rounded-3xl border border-white/5 bg-slate-900/70">
        <header className="flex items-center gap-3 p-5">
          <Link href={`/profile/${post.authorId}`} className="flex items-center gap-3">
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
              <p className="text-xs text-slate-500">{formatTimeAgo(post.createdAt)}</p>
            </div>
          </Link>
        </header>
        {post.mediaUrl && post.mediaType === "image" && (
          <div className="px-5 pb-3">
            {post.mediaUrl.startsWith("data:image") || post.mediaUrl.startsWith("http") ? (
              <img src={post.mediaUrl} alt="" className="w-full rounded-2xl object-cover" />
            ) : (
              <div className="aspect-[16/9] w-full rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            )}
          </div>
        )}
        {post.mediaUrl && post.mediaType === "video" && (
          <div className="px-5 pb-3">
            {post.mediaUrl.startsWith("data:video") || post.mediaUrl.startsWith("http") ? (
              <video src={post.mediaUrl} controls className="w-full rounded-2xl bg-black" />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-violet-700 text-5xl text-white">▶</div>
            )}
          </div>
        )}
        {post.mediaUrl && post.mediaType === "short" && (
          <div className="px-5 pb-3">
            <video src={post.mediaUrl} controls className="aspect-[9/14] max-h-[500px] w-full max-w-[300px] mx-auto rounded-2xl bg-black" />
          </div>
        )}

        <div className="px-5 pb-5">
          {post.content && (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-100">
              {post.content}
            </p>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs text-violet-200">
                  #{t}
                </span>
              ))}
            </div>
          )}
          {post.musicName && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-300">
              🎵 {post.musicName}
            </div>
          )}
        </div>
        <footer className="flex items-center gap-3 border-t border-white/5 px-5 py-3 text-sm text-slate-300">
          <button
            onClick={like}
            className={`rounded-xl px-3 py-1.5 hover:bg-white/5 ${liked ? "text-rose-300" : ""}`}
          >
            ❤️ {post.likes} إعجاب
          </button>
          <span className="rounded-xl px-3 py-1.5">💬 {comments.length} تعليق</span>
          <span className="ms-auto rounded-xl px-3 py-1.5 text-xs text-slate-500">👁 {post.views}</span>
        </footer>
      </article>

      <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">أضف تعليقاً</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="اكتب تعليقك..."
          className="w-full resize-none rounded-2xl border border-white/10 bg-slate-800/50 p-3 text-slate-100 outline-none focus:border-violet-500"
        />
        <div className="mt-2 flex justify-between gap-2">
          <button
            onClick={aiSuggest}
            disabled={aiBusy}
            className="rounded-xl bg-violet-500/20 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/30 disabled:opacity-50"
          >
            {aiBusy ? "..." : "✨ تعليق ذكي"}
          </button>
          <button
            onClick={send}
            className="rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-4 py-1.5 text-sm font-semibold text-white"
          >
            نشر
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
            لا توجد تعليقات بعد. كن أول من يعلق!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3 rounded-2xl border border-white/5 bg-slate-900/50 p-4">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${
                  c.isAi
                    ? "from-violet-500 to-fuchsia-500"
                    : c.authorColor || "from-emerald-500 to-teal-500"
                } text-xs font-bold text-white`}
              >
                {c.isAi ? "✨" : c.authorFirst.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">
                  {c.isAi ? "MiniMax AI" : `${c.authorFirst} ${c.authorLast}`} · {formatTimeAgo(c.createdAt)}
                </p>
                <p className="mt-1 text-sm text-slate-100">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
