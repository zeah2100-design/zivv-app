"use client";

import { useEffect, useState, useRef } from "react";

type Track = {
  id: number;
  title: string;
  artist: string;
  category: string;
  durationSec: number;
  emoji: string;
  color: string;
  isOriginal: boolean;
};

const CATS = [
  { k: "all", l: "🎵 الكل" },
  { k: "شعبي", l: "🎉 شعبي" },
  { k: "درامي", l: "🎭 درامي" },
  { k: "هادئ", l: "🌙 هادئ" },
  { k: "حزين", l: "💔 حزين" },
  { k: "حماسي", l: "🔥 حماسي" },
];

export function MusicPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [cat, setCat] = useState("all");
  const [playing, setPlaying] = useState<Track | null>(null);
  const [progress, setProgress] = useState(0);
  const [mergeWith, setMergeWith] = useState<Track | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/music", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTracks(d.tracks || []));
  }, []);

  useEffect(() => {
    if (!playing) return;
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 100 / (playing.durationSec * 10);
        if (next >= 100) {
          setPlaying(null);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  const filtered = cat === "all" ? tracks : tracks.filter((t) => t.category === cat);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">🎵 مكتبة الموسيقى</h1>
        <p className="mt-1 text-sm text-slate-400">
          موسيقى خالية من حقوق النشر — مع أداة قص ودمج ذكية
        </p>
      </header>

      {/* Player */}
      {playing && (
        <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-5">
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${playing.color} text-3xl`}>
              {playing.emoji}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-white">{playing.title}</p>
              <p className="text-sm text-slate-300">{playing.artist} · {playing.category}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-l from-violet-500 to-fuchsia-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => setPlaying(null)}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              ⏹
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c.k}
            onClick={() => setCat(c.k)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium ${
              cat === c.k ? "bg-violet-500/30 text-violet-100 ring-1 ring-violet-400/50" : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {c.l}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="group overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-4 transition hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${t.color} text-2xl`}>
                {t.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{t.title}</p>
                <p className="truncate text-xs text-slate-400">{t.artist}</p>
                <p className="text-[10px] text-slate-500">
                  {t.category} · {t.durationSec}s
                </p>
              </div>
              <button
                onClick={() => setPlaying(t)}
                className="grid h-10 w-10 place-items-center rounded-full bg-violet-500/20 text-violet-200 hover:bg-violet-500/30"
              >
                ▶
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setMergeWith(t)}
                className="flex-1 rounded-xl bg-white/5 px-2 py-1.5 text-xs text-slate-200 hover:bg-white/10"
              >
                ✂️ قص / دمج
              </button>
              {t.isOriginal && (
                <span className="rounded-xl bg-emerald-500/15 px-2 py-1.5 text-[10px] text-emerald-200">
                  ✓ آمن
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {mergeWith && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-lg font-bold text-white">✂️ قص ودمج الموسيقى</h3>
            <p className="mt-1 text-sm text-slate-400">{mergeWith.title} — {mergeWith.artist}</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-300">بداية المقطع: {trimStart}%</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={trimStart}
                  onChange={(e) => setTrimStart(Math.min(parseInt(e.target.value, 10), trimEnd - 5))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-300">نهاية المقطع: {trimEnd}%</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Math.max(parseInt(e.target.value, 10), trimStart + 5))}
                  className="w-full"
                />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-l from-emerald-500 to-cyan-500"
                  style={{ marginLeft: `${trimStart}%`, width: `${trimEnd - trimStart}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setMergeWith(null)}
                className="flex-1 rounded-2xl bg-white/5 py-2.5 text-sm text-slate-200 hover:bg-white/10"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setPlaying(mergeWith);
                  setMergeWith(null);
                }}
                className="flex-1 rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white"
              >
                🎬 دمج في المنشور
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-200">
        ✓ جميع المقاطع الموسيقية في zivv خالية من حقوق النشر — يمكنك استخدامها بأمان في منشوراتك.
      </div>
    </div>
  );
}
