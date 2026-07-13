"use client";

import { useState, useRef, useEffect } from "react";
import { IMAGE_MODELS, ImageModel } from "@/lib/imageGen";

type ChatMsg = { role: "user" | "ai"; text: string };
type Tab = "chat" | "create";

const ART_PRESETS = [
  { label: "غروب", emoji: "🌅" },
  { label: "محيط", emoji: "🌊" },
  { label: "غابة", emoji: "🌲" },
  { label: "فضاء", emoji: "🌌" },
  { label: "مدينة", emoji: "🌃" },
  { label: "زهور", emoji: "🌸" },
  { label: "بورتريه", emoji: "👤" },
  { label: "جبال", emoji: "⛰️" },
];

export function AIStudioPage() {
  const [tab, setTab] = useState<Tab>("chat");
  const [prompt, setPrompt] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _userId = useState(0);
  const [selectedModel, setSelectedModel] = useState<ImageModel>("grok");
  const [generated, setGenerated] = useState<{ url: string; prompt: string; model: ImageModel } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([
    { role: "ai", text: "مرحباً! أنا zivv.AI، مساعدك الذكي. اسألني أي شيء وسأساعدك بكل سرور. ✨" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat, chatBusy]);

  async function generate() {
    const p = prompt.trim();
    if (!p) return;
    setGenerating(true);
    setGenError(null);
    setGenerated(null);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", prompt: p, model: selectedModel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "فشل توليد الصورة");
      } else {
        setGenerated({ url: data.url, prompt: p, model: selectedModel });
      }
    } catch {
      setGenError("تعذّر الاتصال. حاول مرة أخرى.");
    }
    setGenerating(false);
  }

  async function sendChat() {
    const msg = chatInput.trim();
    if (!msg || chatBusy) return;
    setChatInput("");
    const updatedChat = [...chat, { role: "user" as const, text: msg }];
    setChat(updatedChat);
    setChatBusy(true);

    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: msg,
          history: updatedChat.slice(-10),
        }),
      });
      const data = await res.json();
      const reply = data.result || data.error || "عذراً، حدث خطأ. حاول مرة أخرى.";
      setChat((prev) => [...prev, { role: "ai", text: reply }]);
    } catch {
      setChat((prev) => [...prev, { role: "ai", text: "تعذّر الاتصال بالخادم. حاول مرة أخرى." }]);
    }
    setChatBusy(false);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">
          ✨ <span className="bg-gradient-to-l from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">zivv.AI Studio</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          دردشة ذكية + إنشاء صور بالذكاء الاصطناعي
        </p>
      </header>

      <div className="flex gap-2 rounded-2xl bg-white/5 p-1 text-sm">
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 rounded-xl py-2 font-semibold transition ${
            tab === "chat" ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white" : "text-slate-300"
          }`}
        >
          💬 دردشة ذكية
        </button>
        <button
          onClick={() => setTab("create")}
          className={`flex-1 rounded-xl py-2 font-semibold transition ${
            tab === "create" ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white" : "text-slate-300"
          }`}
        >
          🎨 إنشاء صورة
        </button>
      </div>

      {genError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {genError}
        </div>
      )}

      {tab === "chat" && (
        <div className="grid h-[70vh] grid-rows-[1fr_auto] rounded-3xl border border-white/5 bg-slate-900/70">
          <div ref={chatRef} className="space-y-3 overflow-y-auto p-5">
            {chat.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white"
                      : "bg-white/5 text-slate-100"
                  }`}
                >
                  {m.role === "ai" && <span className="me-2">✨</span>}
                  {m.text}
                </div>
              </div>
            ))}
            {chatBusy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/5 px-4 py-2.5 text-sm text-slate-300">
                  <span className="animate-pulse">⏳ جاري التحضير...</span>
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); sendChat(); }}
            className="flex gap-2 border-t border-white/5 p-3"
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اسأل zivv.AI أي شيء..."
              className="flex-1 rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-2.5 text-slate-100 outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={chatBusy || !chatInput.trim()}
              className="rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              إرسال
            </button>
          </form>
        </div>
      )}

      {tab === "create" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5 space-y-4">
            <ModelSelector selected={selectedModel} onChange={setSelectedModel} />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">وصف الصورة</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="مثال: منظر طبيعي لغروب الشمس فوق محيط هادئ"
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-800/50 p-3 text-slate-100 outline-none focus:border-violet-500"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ART_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPrompt((q) => (q ? `${q}، ${p.label} ${p.emoji}` : `${p.label} ${p.emoji}`))}
                    className="rounded-full bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!prompt.trim() || generating}
              className="w-full rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 disabled:opacity-50"
            >
              {generating ? `⏳ جاري التحضير... (${IMAGE_MODELS[selectedModel].estimatedTime})` : "✨ إنشاء الصورة"}
            </button>
            <p className="text-center text-[10px] text-slate-500">مدعوم بواسطة zivv.AI</p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">النتيجة</h3>
            {generated ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <img src={generated.url} alt={generated.prompt} className="h-auto w-full" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>📝 "{generated.prompt}"</span>
                  <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">
                    {IMAGE_MODELS[generated.model].emoji} {IMAGE_MODELS[generated.model].name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <a href={generated.url} download="zivv-ai-art.jpg" className="flex-1 rounded-xl bg-white/5 px-3 py-1.5 text-center text-xs text-slate-200 hover:bg-white/10">
                    ⬇ تنزيل
                  </a>
                  <button onClick={() => setGenerated(null)} className="rounded-xl bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">
                    🔄 جديدة
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid aspect-square place-items-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-sm text-slate-500">
                {generating ? (
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500" />
                    <p>⏳ جاري التحضير...</p>
                  </div>
                ) : (
                  "ستظهر الصورة هنا"
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelSelector({ selected, onChange }: { selected: ImageModel; onChange: (m: ImageModel) => void }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-200">🎯 اختر النموذج</label>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(IMAGE_MODELS) as ImageModel[]).map((m) => {
          const model = IMAGE_MODELS[m];
          const isActive = selected === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              className={`relative rounded-2xl border-2 p-2.5 text-right transition ${
                isActive ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/30"
              }`}
            >
              {isActive && (
                <span className="absolute end-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-violet-500 text-[9px] text-white">✓</span>
              )}
              <div className="text-xl">{model.emoji}</div>
              <div className="mt-1 text-xs font-semibold text-white">{model.name}</div>
              <div className="mt-0.5 text-[9px] text-slate-400">{model.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
