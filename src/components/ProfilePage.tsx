"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTimeAgo, AVATAR_PALETTE } from "@/lib/utils";
import type { User } from "@/db/schema";
type SafeUser = Omit<User, "passwordHash">;

type ProfileUser = {
  id: number;
  firstName: string;
  lastName: string;
  avatarColor: string | null;
  bio: string | null;
  interests: string[] | null;
  createdAt: string;
};

type Friendship = { id: number; status: string; requesterId: number; addresseeId: number } | null;

type FullUser = ProfileUser & { isGolden?: boolean; isMaster?: boolean };

type PostRow = {
  id: number;
  content: string;
  mediaType: "text" | "image" | "video" | "short";
  views: number;
  likes: number;
  createdAt: string;
  commentCount: number;
};

const SAMPLE_BIOS = [
  "صانع محتوى شغوف بالتقنية والإبداع 🎨",
  "أحب السفر والتصوير الفوتوغرافي 📸",
  "مطور برمجيات وكاتب ✍️",
  "موسيقي ومعلم موسيقى 🎵",
];

export function ProfilePage({ profileId, currentUser }: { profileId: number; currentUser: SafeUser }) {
  const router = useRouter();
  const [user, setUser] = useState<FullUser | null>(null);
  const [myGolden, setMyGolden] = useState(false);
  const [goldenRequestSent, setGoldenRequestSent] = useState(false);
  const [goldenBusy, setGoldenBusy] = useState(false);
  const [friendship, setFriendship] = useState<Friendship>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "analytics">("posts");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [u, p] = await Promise.all([
      fetch(`/api/users/${profileId}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/posts?userId=${profileId}`, { cache: "no-store" }).then((r) => r.json()),
    ]);
    setUser(u.user);
    setFriendship(u.friendship);
    setPosts(p.posts || []);

    // Check if I (currentUser) already sent a golden request
    try {
      const subRes = await fetch("/api/subscriptions", { cache: "no-store" });
      const subData = await subRes.json();
      setMyGolden(!!subData.isGolden);
      if (subData.requests && subData.requests.length > 0) {
        setGoldenRequestSent(subData.requests.some((r: { status: string }) => r.status === "pending"));
      }
    } catch {}
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  const isMe = currentUser.id === profileId;

  async function sendRequest() {
    setBusy(true);
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", targetId: profileId }),
    });
    await load();
    setBusy(false);
  }

  async function requestGolden() {
    setGoldenBusy(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `طلب اشتراك ذهبي من ${user?.firstName} ${user?.lastName}` }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "فشل الطلب");
      } else {
        setGoldenRequestSent(true);
        alert("✅ تم إرسال طلب الاشتراك! سيظهر للملك الأساسي للموافقة.");
      }
    } catch {
      alert("فشل إرسال الطلب");
    }
    setGoldenBusy(false);
  }

  async function startChat() {
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherId: profileId }),
    });
    const data = await res.json();
    if (data.chat?.id) router.push(`/chat/${data.chat.id}`);
  }

  if (!user) {
    return <div className="animate-pulse space-y-4"><div className="h-32 rounded-3xl bg-white/5" /></div>;
  }

  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const engagement = posts.length ? Math.min(100, Math.round((totalLikes / Math.max(1, totalViews)) * 100)) : 0;
  const bio = user.bio || (isMe ? "مرحباً! أنا أستخدم zivv ✨" : SAMPLE_BIOS[user.id % SAMPLE_BIOS.length]);

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950">
        <div className="h-32 bg-gradient-to-l from-teal-600 via-cyan-600 to-indigo-500 opacity-60" />
        <div className="-mt-12 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${
                user.avatarColor || "from-teal-500 to-cyan-500"
              } text-3xl font-bold text-white ring-4 ring-slate-900`}
            >
              {user.firstName.charAt(0)}
            </div>
            <div className="mb-1">
              <h1 className="text-2xl font-bold text-white">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-slate-400">@{user.firstName.toLowerCase()}</p>
              <p className="mt-1 max-w-md text-sm text-slate-300">{bio}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Golden subscription button - always shown for non-master users */}
            {!isMe && user && !user.isMaster && (
              <GoldenButton
                isGolden={myGolden}
                requestSent={goldenRequestSent}
                busy={goldenBusy}
                onClick={requestGolden}
              />
            )}
            {!isMe && (
              <>
                {(!friendship || friendship.status === "rejected") ? (
                  <button
                    onClick={sendRequest}
                    disabled={busy}
                    className="rounded-2xl bg-gradient-to-l from-teal-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-60"
                  >
                    + إضافة صديق
                  </button>
                ) : friendship.status === "pending" ? (
                  <span className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-300">⏳ طلب مرسل</span>
                ) : (
                  <>
                    <span className="rounded-2xl bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200">✓ صديق</span>
                    <button
                      onClick={startChat}
                      className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                    >
                      💬 مراسلة
                    </button>
                  </>
                )}
              </>
            )}
            {isMe && (
              <>
                {user && !user.isMaster && !myGolden && (
                  <GoldenButton
                    isGolden={false}
                    requestSent={goldenRequestSent}
                    busy={goldenBusy}
                    onClick={requestGolden}
                  />
                )}
                {user && !user.isMaster && myGolden && (
                  <span className="rounded-2xl bg-gradient-to-l from-amber-500/20 to-orange-500/20 px-4 py-2 text-sm font-semibold text-amber-300 ring-1 ring-amber-500/30">
                    ⭐ مشترك ذهبي
                  </span>
                )}
                <Link
                  href="/settings"
                  className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                >
                  ⚙️ تعديل الملف
                </Link>
              </>
            )}
          </div>
        </div>
        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-6 pb-5">
            {user.interests.map((i) => (
              <span key={i} className="rounded-full bg-teal-500/20 px-3 py-1 text-xs text-teal-200">
                {i}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="المنشورات" value={posts.length} />
        <Stat label="المشاهدات" value={totalViews} />
        <Stat label="الإعجابات" value={totalLikes} />
        <Stat label="نسبة التفاعل" value={`${engagement}%`} />
      </div>

      <div className="flex gap-2 border-b border-white/5">
        <TabBtn active={activeTab === "posts"} onClick={() => setActiveTab("posts")}>📝 المنشورات</TabBtn>
        <TabBtn active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}>📊 الإحصائيات</TabBtn>
      </div>

      {activeTab === "posts" ? (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
              لا توجد منشورات بعد.
            </p>
          ) : (
            posts.map((p) => (
              <Link
                href={`/post/${p.id}`}
                key={p.id}
                className="block rounded-2xl border border-white/5 bg-slate-900/60 p-4 transition hover:bg-slate-800/60"
              >
                <p className="line-clamp-2 text-sm text-slate-100">{p.content}</p>
                <div className="mt-2 flex gap-3 text-xs text-slate-400">
                  <span>❤️ {p.likes}</span>
                  <span>💬 {p.commentCount}</span>
                  <span>👁 {p.views}</span>
                  <span className="ms-auto">{formatTimeAgo(p.createdAt)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">📊 تحليلات المنشورات</h3>
          {posts.length === 0 ? (
            <p className="text-sm text-slate-400">لا توجد بيانات لعرضها بعد.</p>
          ) : (
            <div className="space-y-4">
              {posts.slice(0, 8).map((p) => {
                const maxV = Math.max(...posts.map((x) => x.views), 1);
                const w = (p.views / maxV) * 100;
                return (
                  <div key={p.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="line-clamp-1 max-w-[60%] text-slate-300">{p.content || "—"}</span>
                      <span className="text-slate-500">{p.views} مشاهدة</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-teal-500 to-cyan-500"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                      <span>❤️ {p.likes}</span>
                      <span>💬 {p.commentCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
        active ? "border-teal-500 text-white" : "border-transparent text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function GoldenButton({
  isGolden,
  requestSent,
  busy,
  onClick,
}: {
  isGolden: boolean;
  requestSent: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  if (isGolden) {
    return (
      <span className="rounded-2xl bg-gradient-to-l from-amber-500/20 to-orange-500/20 px-4 py-2 text-sm font-semibold text-amber-300 ring-1 ring-amber-500/30">
        ⭐ مشترك ذهبي
      </span>
    );
  }
  if (requestSent) {
    return (
      <span className="rounded-2xl bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300">
        ⏳ طلب اشتراك ذهبي مرسل
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="rounded-2xl bg-gradient-to-l from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-amber-500/30 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
    >
      {busy ? "⏳ جاري الإرسال..." : "⭐ اشتراك ذهبي"}
    </button>
  );
}
