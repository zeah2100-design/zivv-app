"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type Short = {
  id: number;
  content: string;
  mediaUrl: string | null;
  musicName: string | null;
  views: number;
  likes: number;
  createdAt: string;
  authorId: number;
  authorFirst: string;
  authorLast: string;
  authorColor: string | null;
};

const GRADIENTS = [
  "from-violet-700 via-fuchsia-600 to-rose-500",
  "from-cyan-600 via-blue-600 to-indigo-700",
  "from-emerald-600 via-teal-600 to-cyan-700",
  "from-amber-600 via-orange-600 to-rose-600",
  "from-pink-600 via-fuchsia-700 to-violet-800",
  "from-slate-800 via-violet-800 to-fuchsia-900",
];

function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 17 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

export function ShortsPage() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/posts?type=short", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const real = (d.posts || []) as Short[];
        // provide demo shorts if none exist
        if (real.length === 0) {
          setShorts([
            { id: -1, content: "تجربة تصفح عمودية بملء الشاشة! 🚀", mediaUrl: null, musicName: "Future Beats", views: 1240, likes: 89, createdAt: new Date().toISOString(), authorId: 0, authorFirst: "zivv", authorLast: "Demo", authorColor: "from-violet-500 to-fuchsia-500" },
            { id: -2, content: "اسحب للأعلى لاستكشاف المزيد ✨", mediaUrl: null, musicName: "Calm Vibes", views: 890, likes: 45, createdAt: new Date().toISOString(), authorId: 0, authorFirst: "zivv", authorLast: "Studio", authorColor: "from-cyan-500 to-blue-500" },
            { id: -3, content: "أزرار الإعجاب والتعليق والاشتراك في متناول يدك", mediaUrl: null, musicName: "Pop Energy", views: 2100, likes: 173, createdAt: new Date().toISOString(), authorId: 0, authorFirst: "zivv", authorLast: "Shorts", authorColor: "from-amber-500 to-rose-500" },
          ]);
        } else {
          setShorts(real);
        }
        setLoading(false);
      });
  }, []);

  const onScroll = useCallback(() => {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    if (idx !== active) setActive(idx);
  }, [active]);

  async function like(id: number) {
    if (id < 0) return;
    await fetch(`/api/posts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });
  }

  if (loading) {
    return <div className="grid h-[70vh] place-items-center"><div className="text-slate-400">جاري التحميل...</div></div>;
  }

  return (
    <div className="-mx-4 -mt-6 lg:-mx-8 lg:-mt-10">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-[calc(100vh-5rem)] snap-y snap-mandatory overflow-y-scroll lg:h-[calc(100vh-2rem)]"
      >
        {shorts.map((s, i) => (
          <div
            key={s.id}
            className={`relative flex h-full w-full snap-start items-center justify-center bg-gradient-to-br ${gradientFor(
              String(s.id)
            )}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            <div className="relative z-10 mx-auto flex h-full max-w-md flex-col justify-end gap-3 p-6 text-white">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${
                    s.authorColor || "from-violet-500 to-fuchsia-500"
                  } text-sm font-bold ring-2 ring-white/30`}
                >
                  {s.authorFirst.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{s.authorFirst} {s.authorLast}</p>
                  <p className="text-xs text-white/70">@{s.authorFirst.toLowerCase()}</p>
                </div>
                <button className="ms-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur hover:bg-white/25">
                  + متابعة
                </button>
              </div>
              <p className="text-base leading-relaxed">{s.content}</p>
              {s.musicName && (
                <div className="flex items-center gap-2 text-xs text-white/80">
                  🎵 {s.musicName}
                </div>
              )}

              <div className="absolute bottom-20 left-4 flex flex-col items-center gap-4">
                <button onClick={() => like(s.id)} className="flex flex-col items-center gap-1">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-xl backdrop-blur hover:bg-white/25">❤️</span>
                  <span className="text-xs">{s.likes}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-xl backdrop-blur hover:bg-white/25">💬</span>
                  <span className="text-xs">تعليق</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-xl backdrop-blur hover:bg-white/25">↗</span>
                  <span className="text-xs">مشاركة</span>
                </button>
              </div>

              <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/60">
                {i + 1} / {shorts.length} · اسحب للأعلى ⬆
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
