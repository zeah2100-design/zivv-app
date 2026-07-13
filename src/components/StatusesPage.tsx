"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { User } from "@/db/schema";

type SafeUser = Omit<User, "passwordHash">;

type Status = {
  id: number;
  userId: number;
  type: "text" | "image" | "video";
  content: string | null;
  mediaUrl: string | null;
  backgroundColor: string;
  textColor: string;
  textPosition: "top" | "center" | "bottom";
  fontSize: number;
  fontFamily: string;
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  avatarColor: string | null;
};

type Tab = "feed" | "create";

const GRADIENTS = [
  { name: "بنفسجي", value: "from-violet-500 to-fuchsia-500" },
  { name: "وردي", value: "from-pink-500 to-rose-500" },
  { name: "برتقالي", value: "from-amber-500 to-orange-500" },
  { name: "أخضر", value: "from-emerald-500 to-teal-500" },
  { name: "أزرق", value: "from-sky-500 to-cyan-500" },
  { name: "بنفسجي غامق", value: "from-indigo-500 to-purple-500" },
  { name: "ذهبي", value: "from-amber-400 via-yellow-500 to-orange-500" },
  { name: "أسود", value: "from-slate-800 to-slate-900" },
];

const TEXT_COLORS = [
  { name: "أبيض", value: "#ffffff" },
  { name: "أسود", value: "#000000" },
  { name: "أصفر", value: "#fde047" },
  { name: "أحمر", value: "#ef4444" },
  { name: "أزرق", value: "#3b82f6" },
  { name: "وردي", value: "#ec4899" },
];

const FONTS = [
  { name: "Cairo", value: "cairo" },
  { name: "Tajawal", value: "tajawal" },
  { name: "Almarai", value: "almarai" },
  { name: "Amiri", value: "amiri" },
];

const POSITIONS = [
  { name: "أعلى", value: "top" as const, icon: "⬆️" },
  { name: "وسط", value: "center" as const, icon: "⏺️" },
  { name: "أسفل", value: "bottom" as const, icon: "⬇️" },
];

export function StatusesPage({ user }: { user: SafeUser }) {
  const [tab, setTab] = useState<Tab>("feed");
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Status | null>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Create form state
  const [createType, setCreateType] = useState<"text" | "image" | "video">("text");
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [bg, setBg] = useState(GRADIENTS[0].value);
  const [textColor, setTextColor] = useState("#ffffff");
  const [position, setPosition] = useState<"top" | "center" | "bottom">("center");
  const [fontSize, setFontSize] = useState(32);
  const [font, setFont] = useState("cairo");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/status-updates", { cache: "no-store" });
    const data = await res.json();
    setStatuses(data.statuses || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-progress for status viewer
  useEffect(() => {
    if (!viewing) return;
    setProgress(0);
    const duration = viewing.type === "video" ? 15000 : 5000;
    const interval = 100;
    const step = (interval / duration) * 100;
    const t = setInterval(() => {
      setProgress((p) => {
        const next = p + step;
        if (next >= 100) {
          clearInterval(t);
          nextStatus();
        }
        return next;
      });
    }, interval);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing, viewIndex]);

  function nextStatus() {
    if (viewIndex < statuses.length - 1) {
      setViewIndex(viewIndex + 1);
      setViewing(statuses[viewIndex + 1]);
    } else {
      setViewing(null);
      setViewIndex(0);
    }
  }

  function prevStatus() {
    if (viewIndex > 0) {
      setViewIndex(viewIndex - 1);
      setViewing(statuses[viewIndex - 1]);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) {
      setError("الملف كبير جداً (الحد 15MB)");
      return;
    }
    setUploading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setMediaUrl(dataUrl);
      setMediaBase64(dataUrl.split(",")[1]);
      if (f.type.startsWith("video/")) setCreateType("video");
      else if (f.type.startsWith("image/")) setCreateType("image");
      setUploading(false);
    };
    reader.onerror = () => {
      setError("فشلت قراءة الملف");
      setUploading(false);
    };
    reader.readAsDataURL(f);
  }

  async function publish() {
    if (createType === "text" && !text.trim()) {
      setError("اكتب نصاً للحالة");
      return;
    }
    if ((createType === "image" || createType === "video") && !mediaBase64) {
      setError("ارفع صورة أو فيديو");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        type: createType,
        content: text || null,
        mediaUrl: mediaBase64 || null,
        backgroundColor: bg,
        textColor,
        textPosition: position,
        fontSize,
        fontFamily: font,
      };
      const res = await fetch("/api/status-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل النشر");
      } else {
        // Reset
        setText("");
        setMediaUrl(null);
        setMediaBase64(null);
        setTab("feed");
        load();
      }
    } catch {
      setError("تعذّر النشر");
    }
    setPublishing(false);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">
          🌟 <span className="bg-gradient-to-l from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">الحالات</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          شارك لحظاتك مع نص وصور وفيديو · تنتهي بعد 24 ساعة
        </p>
      </header>

      <div className="flex gap-2 rounded-2xl bg-white/5 p-1 text-sm">
        <button
          onClick={() => setTab("feed")}
          className={`flex-1 rounded-xl py-2 font-semibold transition ${
            tab === "feed" ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white" : "text-slate-300"
          }`}
        >
          👁️ مشاهدة
        </button>
        <button
          onClick={() => setTab("create")}
          className={`flex-1 rounded-xl py-2 font-semibold transition ${
            tab === "create" ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white" : "text-slate-300"
          }`}
        >
          ✨ إنشاء حالة
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      )}

      {tab === "feed" && (
        <div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[9/16] animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : statuses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
              <p className="text-4xl">📭</p>
              <p className="mt-3 text-slate-300">لا توجد حالات حالياً</p>
              <p className="mt-1 text-sm text-slate-500">كن أول من ينشر حالة!</p>
              <button
                onClick={() => setTab("create")}
                className="mt-4 rounded-2xl bg-violet-500/20 px-5 py-2 text-sm text-violet-200 hover:bg-violet-500/30"
              >
                ✨ أنشئ حالة
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {statuses.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { setViewing(s); setViewIndex(i); }}
                  className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10"
                >
                  {s.type === "text" && (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${s.backgroundColor} p-4`}>
                      <p
                        className="text-center font-bold"
                        style={{
                          color: s.textColor,
                          fontSize: `${s.fontSize}px`,
                          fontFamily: s.fontFamily,
                        }}
                      >
                        {s.content}
                      </p>
                    </div>
                  )}
                  {s.type === "image" && s.mediaUrl && (
                    <>
                      <img src={s.mediaUrl} alt="" className="h-full w-full object-cover" />
                      <div
                        className="absolute inset-0 flex bg-black/30 p-4"
                        style={{
                          alignItems: s.textPosition === "top" ? "flex-start" : s.textPosition === "bottom" ? "flex-end" : "center",
                          justifyContent: "center",
                        }}
                      >
                        <p
                          className="text-center font-bold drop-shadow-lg"
                          style={{
                            color: s.textColor,
                            fontSize: `${s.fontSize}px`,
                            fontFamily: s.fontFamily,
                            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                          }}
                        >
                          {s.content}
                        </p>
                      </div>
                    </>
                  )}
                  {s.type === "video" && s.mediaUrl && (
                    <>
                      <video src={s.mediaUrl} muted className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-white/30 backdrop-blur text-2xl">▶</div>
                      </div>
                    </>
                  )}
                  <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 text-[10px] text-white backdrop-blur">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${s.avatarColor || "from-violet-500 to-fuchsia-500"} text-[10px] font-bold`}>
                      {s.firstName.charAt(0)}
                    </div>
                    <span>{s.firstName}</span>
                  </div>
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white backdrop-blur">
                    👁 {s.viewsCount}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "create" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-200">📝 نوع الحالة</label>
              <div className="grid grid-cols-3 gap-2">
                {(["text", "image", "video"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setCreateType(t); setError(null); }}
                    className={`rounded-2xl border-2 p-3 text-sm font-semibold ${
                      createType === t ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5"
                    }`}
                  >
                    {t === "text" ? "📝 نص" : t === "image" ? "🖼️ صورة" : "🎬 فيديو"}
                  </button>
                ))}
              </div>
            </div>

            {(createType === "image" || createType === "video") && (
              <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  📤 ارفع {createType === "image" ? "صورة" : "فيديو"}
                </label>
                <input ref={fileInputRef} type="file" accept={createType === "image" ? "image/*" : "video/*"} onChange={handleFile} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-2xl border-2 border-dashed border-white/20 bg-white/5 px-4 py-6 text-sm text-slate-300 hover:border-violet-500 hover:bg-violet-500/10"
                >
                  {uploading ? "⏳ جاري الرفع..." : mediaUrl ? "🔄 اختر ملفاً آخر" : `📁 اضغط لرفع ${createType === "image" ? "صورة" : "فيديو"}`}
                </button>
              </div>
            )}

            <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-200">✍️ النص</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="اكتب النص الذي سيظهر فوق صورتك أو فيديوك..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-800/50 p-3 text-slate-100 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-200">🎨 الخلفية (للنصوص)</label>
              <div className="grid grid-cols-4 gap-2">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setBg(g.value)}
                    className={`h-12 rounded-xl bg-gradient-to-br ${g.value} ring-2 ${
                      bg === g.value ? "ring-white" : "ring-transparent"
                    }`}
                    title={g.name}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-200">🎨 لون النص</label>
              <div className="grid grid-cols-6 gap-2">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setTextColor(c.value)}
                    className={`h-10 rounded-xl ring-2 ${
                      textColor === c.value ? "ring-violet-500" : "ring-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                📍 موقع النص: {POSITIONS.find((p) => p.value === position)?.name}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPosition(p.value)}
                    className={`rounded-2xl p-3 text-sm ${
                      position === p.value ? "bg-violet-500/20 ring-2 ring-violet-500" : "bg-white/5"
                    }`}
                  >
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                📏 حجم الخط: {fontSize}px
              </label>
              <input
                type="range"
                min="16"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-200">✍️ نوع الخط</label>
              <div className="grid grid-cols-2 gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFont(f.value)}
                    className={`rounded-xl p-2 text-sm ${
                      font === f.value ? "bg-violet-500/20 ring-2 ring-violet-500" : "bg-white/5"
                    }`}
                    style={{ fontFamily: f.value }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={publish}
              disabled={publishing || uploading}
              className="w-full rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 disabled:opacity-50"
            >
              {publishing ? "⏳ جاري النشر..." : "✨ نشر الحالة"}
            </button>
          </div>

          {/* Live preview */}
          <div className="lg:col-span-2">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">👁 معاينة مباشرة</h3>
            <div className="mx-auto h-[500px] max-w-sm overflow-hidden rounded-3xl border-2 border-white/10 shadow-2xl">
              {createType === "text" ? (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${bg} p-6`}>
                  <p
                    className="text-center font-bold"
                    style={{ color: textColor, fontSize: `${fontSize}px`, fontFamily: font }}
                  >
                    {text || "معاينة النص"}
                  </p>
                </div>
              ) : createType === "image" && mediaUrl ? (
                <div className="relative h-full w-full">
                  <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
                  <div
                    className="absolute inset-0 flex bg-black/30 p-6"
                    style={{
                      alignItems: position === "top" ? "flex-start" : position === "bottom" ? "flex-end" : "center",
                      justifyContent: "center",
                    }}
                  >
                    <p
                      className="text-center font-bold"
                      style={{
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        fontFamily: font,
                        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                      }}
                    >
                      {text}
                    </p>
                  </div>
                </div>
              ) : createType === "video" && mediaUrl ? (
                <div className="relative h-full w-full">
                  <video src={mediaUrl} muted loop autoPlay className="h-full w-full object-cover" />
                  <div
                    className="absolute inset-0 flex bg-black/30 p-6"
                    style={{
                      alignItems: position === "top" ? "flex-start" : position === "bottom" ? "flex-end" : "center",
                      justifyContent: "center",
                    }}
                  >
                    <p
                      className="text-center font-bold"
                      style={{
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        fontFamily: font,
                        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                      }}
                    >
                      {text}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-center text-slate-500">
                  <div>
                    <p className="text-4xl">📤</p>
                    <p className="mt-2 text-sm">ارفع {createType === "image" ? "صورة" : createType === "video" ? "فيديو" : "نص"} للمعاينة</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full screen viewer */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={() => setViewing(null)}>
          {/* Progress bar */}
          <div className="absolute left-0 right-0 top-0 flex gap-1 p-2">
            {statuses.map((s, i) => (
              <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: i < viewIndex ? "100%" : i === viewIndex ? `${progress}%` : "0%" }}
                />
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="absolute left-4 top-6 z-10 flex items-center gap-2 text-white">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${viewing.avatarColor || "from-violet-500 to-fuchsia-500"} text-sm font-bold`}>
              {viewing.firstName.charAt(0)}
            </div>
            <p className="text-sm font-semibold">{viewing.firstName} {viewing.lastName}</p>
            <span className="text-xs text-white/60">· {new Date(viewing.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          {/* Close button */}
          <button
            onClick={() => setViewing(null)}
            className="absolute right-4 top-6 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            ✕
          </button>

          {/* Content */}
          <div className="relative h-full w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {viewing.type === "text" && (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${viewing.backgroundColor} p-8`}>
                <p className="text-center font-bold text-white" style={{ color: viewing.textColor, fontSize: `${viewing.fontSize}px`, fontFamily: viewing.fontFamily }}>
                  {viewing.content}
                </p>
              </div>
            )}
            {viewing.type === "image" && viewing.mediaUrl && (
              <div className="relative h-full w-full">
                <img src={viewing.mediaUrl} alt="" className="h-full w-full object-contain bg-black" />
                {viewing.content && (
                  <div className="absolute inset-0 flex bg-black/30 p-8" style={{ alignItems: viewing.textPosition === "top" ? "flex-start" : viewing.textPosition === "bottom" ? "flex-end" : "center", justifyContent: "center" }}>
                    <p className="text-center font-bold" style={{ color: viewing.textColor, fontSize: `${viewing.fontSize}px`, fontFamily: viewing.fontFamily, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                      {viewing.content}
                    </p>
                  </div>
                )}
              </div>
            )}
            {viewing.type === "video" && viewing.mediaUrl && (
              <div className="relative h-full w-full">
                <video src={viewing.mediaUrl} autoPlay controls className="h-full w-full object-contain bg-black" />
                {viewing.content && (
                  <div className="absolute inset-0 flex bg-black/30 p-8 pointer-events-none" style={{ alignItems: viewing.textPosition === "top" ? "flex-start" : viewing.textPosition === "bottom" ? "flex-end" : "center", justifyContent: "center" }}>
                    <p className="text-center font-bold" style={{ color: viewing.textColor, fontSize: `${viewing.fontSize}px`, fontFamily: viewing.fontFamily, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                      {viewing.content}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <button onClick={(e) => { e.stopPropagation(); prevStatus(); }} className="absolute left-0 top-0 h-full w-1/3" />
          <button onClick={(e) => { e.stopPropagation(); nextStatus(); }} className="absolute right-0 top-0 h-full w-1/3" />
        </div>
      )}
    </div>
  );
}
