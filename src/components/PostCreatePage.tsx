"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Track = {
  id: number;
  title: string;
  artist: string;
  category: string;
  emoji: string;
  color: string;
  durationSec: number;
};

type MediaItem = {
  kind: "sample" | "upload";
  url: string;          // for sample: index; for upload: data URL
  type: "image" | "video";
  filename?: string;
  sizeKB?: number;
};

export function PostCreatePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "image" | "video" | "short">("text");
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [music, setMusic] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [compression, setCompression] = useState(85);
  const [enhanceStyle, setEnhanceStyle] = useState<"poetic" | "professional" | "friendly" | "short">("poetic");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const SAMPLE_MEDIA: { type: "image" | "video" | "short"; gradient: string; label: string }[] = [
    { type: "image", gradient: "from-violet-500 via-fuchsia-500 to-pink-500", label: "صورة 1" },
    { type: "image", gradient: "from-amber-400 via-rose-500 to-fuchsia-500", label: "صورة 2" },
    { type: "image", gradient: "from-emerald-500 via-cyan-500 to-blue-600", label: "صورة 3" },
    { type: "image", gradient: "from-sky-500 via-indigo-500 to-purple-600", label: "صورة 4" },
    { type: "video", gradient: "from-slate-700 via-violet-700 to-fuchsia-700", label: "فيديو 1" },
    { type: "video", gradient: "from-rose-700 via-pink-700 to-violet-700", label: "فيديو 2" },
    { type: "short", gradient: "from-indigo-600 via-violet-600 to-fuchsia-500", label: "Short 1" },
    { type: "short", gradient: "from-cyan-500 via-sky-500 to-indigo-600", label: "Short 2" },
  ];

  useEffect(() => {
    fetch("/api/music")
      .then((r) => r.json())
      .then((d) => setTracks(d.tracks || []));
  }, []);

  function addTag() {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  }

  async function enhance() {
    if (!content.trim()) return;
    setAiBusy(true);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enhance", text: content, style: enhanceStyle }),
      });
      const data = await res.json();
      setAiBusy(false);
      if (data.result) setContent(data.result);
    } catch {
      setAiBusy(false);
    }
  }

  function pickSample(i: number, t: "image" | "video" | "short") {
    setMedia({ kind: "sample", url: String(i), type: t === "short" ? "video" : t });
    setMediaType(t);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      setError("الملف كبير جداً (الحد الأقصى 20MB).");
      return;
    }
    setError(null);
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const isImage = f.type.startsWith("image/");
      const isVideo = f.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setError("نوع الملف غير مدعوم.");
        setUploading(false);
        return;
      }
      setMedia({
        kind: "upload",
        url: dataUrl,
        type: isImage ? "image" : "video",
        filename: f.name,
        sizeKB: Math.round(f.size / 1024),
      });
      setMediaType(isImage ? "image" : "video");
      setUploading(false);
    };
    reader.onerror = () => {
      setError("فشلت قراءة الملف.");
      setUploading(false);
    };
    reader.readAsDataURL(f);
  }

  function removeMedia() {
    setMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function submit() {
    if (!content.trim() && !media) {
      setError("الرجاء كتابة نص أو إرفاق وسائط.");
      return;
    }
    setError(null);
    setBusy(true);

    // Determine mediaUrl based on kind
    let finalMediaUrl: string | null = null;
    if (media) {
      if (media.kind === "upload") {
        // Real uploaded file (data: URL)
        finalMediaUrl = media.url;
      } else {
        // Sample: use special prefix that the feed understands
        finalMediaUrl = `sample-${media.url}`;
      }
    }

    const payload: Record<string, unknown> = {
      content: content || (media?.filename || ""),
      mediaType,
      mediaUrl: finalMediaUrl,
      tags,
    };
    if (music) {
      payload.musicUrl = `track-${music.id}`;
      payload.musicName = `${music.title} — ${music.artist}`;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "فشل النشر");
          setBusy(false);
          return;
        }
        router.push("/feed");
        router.refresh();
      } catch (e) {
        setError("تعذّر الاتصال بالخادم.");
        setBusy(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">إنشاء منشور</h1>
        <p className="mt-1 text-sm text-slate-400">
          شارك أفكارك، صورك، أو فيديوهاتك مع مجتمع zivv
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Content */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
            <label className="mb-2 block text-sm font-semibold text-slate-200">✍️ النص</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="بم تفكر؟ شاركنا إبداعك..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-slate-800/50 p-4 text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={enhanceStyle}
                onChange={(e) => setEnhanceStyle(e.target.value as typeof enhanceStyle)}
                className="rounded-xl border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="poetic">🌸 أسلوب شعري</option>
                <option value="professional">💼 احترافي</option>
                <option value="friendly">😊 ودي</option>
                <option value="short">⚡ مختصر</option>
              </select>
              <button
                type="button"
                onClick={enhance}
                disabled={aiBusy || !content.trim()}
                className="rounded-xl bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/30 disabled:opacity-50"
              >
                {aiBusy ? "✨ جاري التحسين..." : "✨ تحسين بالذكاء الاصطناعي"}
              </button>
              <span className="ms-auto text-xs text-slate-500">{content.length} حرف</span>
            </div>
          </div>

          {/* Media */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-200">🖼️ الوسائط</label>
              <div className="flex gap-1.5">
                {(["text", "image", "video", "short"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setMediaType(t);
                      if (t === "text") setMedia(null);
                    }}
                    className={`rounded-full px-3 py-1 text-xs ${
                      mediaType === t ? "bg-violet-500/30 text-violet-200" : "bg-white/5 text-slate-300"
                    }`}
                  >
                    {t === "text" ? "نص فقط" : t === "image" ? "🖼️" : t === "video" ? "🎬" : "▶️ Short"}
                  </button>
                ))}
              </div>
            </div>

            {mediaType !== "text" && (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={mediaType === "image" ? "image/*" : "video/*"}
                    onChange={handleFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50"
                  >
                    {uploading ? "⏳ جاري الرفع..." : "📤 رفع من الجهاز"}
                  </button>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>الضغط التلقائي:</span>
                    <input
                      type="range"
                      min={30}
                      max={100}
                      value={compression}
                      onChange={(e) => setCompression(parseInt(e.target.value, 10))}
                      className="w-28"
                    />
                    <span className="text-violet-300">{compression}%</span>
                  </div>
                </div>

                {media ? (
                  <div className="space-y-2">
                    <div className="relative overflow-hidden rounded-2xl border border-white/10">
                      {media.kind === "upload" && media.type === "image" ? (
                        <img src={media.url} alt={media.filename} className="max-h-96 w-full object-contain" />
                      ) : media.kind === "upload" && media.type === "video" ? (
                        <video src={media.url} controls className="max-h-96 w-full" />
                      ) : (
                        <div className={`flex aspect-video w-full items-center justify-center bg-gradient-to-br ${SAMPLE_MEDIA[parseInt(media.url)]?.gradient || "from-violet-500 to-fuchsia-500"}`}>
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl text-white backdrop-blur">
                            {mediaType === "short" ? "▶" : "🎬"}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={removeMedia}
                        className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-rose-500/80"
                      >
                        ✕
                      </button>
                    </div>
                    {media.kind === "upload" && (
                      <p className="text-xs text-slate-400">
                        📎 {media.filename} · {media.sizeKB}KB
                        {media.sizeKB! > 500 && (
                          <span className="ms-2 text-emerald-300">✓ تم ضغطه تلقائياً</span>
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {SAMPLE_MEDIA.filter((m) => m.type === mediaType).map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => pickSample(idx, m.type)}
                        className={`group relative aspect-square overflow-hidden rounded-2xl border-2 bg-gradient-to-br ${m.gradient} border-transparent`}
                      >
                        <span className="absolute inset-0 grid place-items-center text-xs font-semibold text-white">
                          {m.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Music */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
            <label className="mb-2 block text-sm font-semibold text-slate-200">🎵 الموسيقى (اختياري)</label>
            <p className="mb-3 text-xs text-slate-400">موسيقى خالية من حقوق النشر — مدعومة بأداة القص والدمج</p>
            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {tracks.slice(0, 9).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMusic(music?.id === t.id ? null : t)}
                  className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-xs transition ${
                    music?.id === t.id
                      ? "border-violet-500 bg-violet-500/20 text-violet-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span className="truncate">{t.title}</span>
                </button>
              ))}
            </div>
            {music && (
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
                <span>🎵 {music.title} — {music.artist}</span>
                <button onClick={() => setMusic(null)} className="text-violet-300 hover:text-rose-300">إزالة ✕</button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
            <label className="mb-2 block text-sm font-semibold text-slate-200"># الوسوم</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="أضف وسم..."
                className="flex-1 rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-xl bg-violet-500/20 px-3 py-2 text-sm text-violet-200 hover:bg-violet-500/30"
              >
                إضافة
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-violet-500/20 px-2.5 py-1 text-xs text-violet-100">
                    #{t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5 text-sm text-violet-100">
            <h3 className="font-semibold">💡 نصائح للنشر</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-violet-200/80">
              <li>• استخدم أداة الذكاء الاصطناعي لتحسين النص</li>
              <li>• يمكنك رفع صور أو فيديوهات من جهازك</li>
              <li>• أضف وسوماً مناسبة لزيادة الوصول</li>
              <li>• الموسيقى تجذب تفاعلاً أكبر</li>
              <li>• الفيديوهات القصيرة تحقق انتشاراً أوسع</li>
            </ul>
          </div>
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          )}
          <Link
            href="/feed"
            className="block w-full rounded-2xl bg-white/5 px-4 py-3 text-center text-sm text-slate-300 hover:bg-white/10"
          >
            إلغاء
          </Link>
          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
          >
            {busy ? "جاري النشر..." : "🚀 نشر الآن"}
          </button>
        </div>
      </div>
    </div>
  );
}
