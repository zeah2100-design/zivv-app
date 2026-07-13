"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";

const INTERESTS = ["تكنولوجيا", "فن", "موسيقى", "رياضة", "تعليم", "سفر", "طبخ", "أفلام"];

type Mode = "signup" | "login";

function detectIdentifier(id: string): "email" | "phone" | "none" {
  if (!id) return "none";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) return "email";
  const cleaned = id.replace(/[\s\-()]/g, "");
  if (/^\+?\d{8,15}$/.test(cleaned)) return "phone";
  return "none";
}

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleInterest(i: string) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (!firstName.trim() || !lastName.trim()) {
        setError("الاسم الأول واسم العائلة مطلوبان.");
        return;
      }
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
        setError("يجب أن يكون عمرك 18+ لاستخدام zivv.");
        return;
      }
      if (!password || password.length < 4) {
        setError("كلمة المرور يجب أن تكون 4 أحرف على الأقل.");
        return;
      }
      if (password !== confirmPassword) {
        setError("كلمتا المرور غير متطابقتين.");
        return;
      }
      if (identifier) {
        const k = detectIdentifier(identifier);
        if (k === "none") {
          setError("الرجاء إدخال بريد إلكتروني صالح أو رقم هاتف دولي (أو اتركه فارغاً).");
          return;
        }
      }
    } else {
      if (!firstName.trim() || !lastName.trim() || !password) {
        setError("الاسم الكامل وكلمة المرور مطلوبان.");
        return;
      }
    }

    startTransition(async () => {
      try {
        const url = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
        const body =
          mode === "signup"
            ? { firstName, lastName, age, password, identifier: identifier || undefined, interests }
            : { firstName, lastName, password };
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "حدث خطأ، حاول مرة أخرى.");
          return;
        }
        router.push("/feed");
        router.refresh();
      } catch {
        setError("تعذّر الاتصال بالخادم.");
      }
    });
  }

  const idKind = detectIdentifier(identifier);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <div className="hidden flex-col justify-center lg:flex">
          <div className="mb-6 flex items-center gap-4">
            <Logo size={64} />
            <div>
              <h1 className="text-5xl font-black tracking-tight text-white">zivv</h1>
              <p className="text-sm text-slate-400">منصة التواصل الذكية</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold leading-tight text-white">
            تواصل، أبدع، <br />
            <span className="bg-gradient-to-l from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              بأمان تام.
            </span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
            منصة اجتماعية متكاملة تجمع بين الخصوصية المطلقة، مساعد MiniMax الذكي،
            مكتبة موسيقية، دردشة مشفّرة، وفيديوهات قصيرة.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2"><span className="text-violet-400">●</span> حماية عمرية تلقائية (18+)</li>
            <li className="flex items-center gap-2"><span className="text-violet-400">●</span> دخول آمن بالاسم + كلمة المرور</li>
            <li className="flex items-center gap-2"><span className="text-violet-400">●</span> ربط بالبريد/الهاتف لاسترداد الحساب</li>
            <li className="flex items-center gap-2"><span className="text-violet-400">●</span> تشفير تام للرسائل والخزنة</li>
            <li className="flex items-center gap-2"><span className="text-violet-400">●</span> ذكاء اصطناعي مدمج (MiniMax)</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-7 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
            <Logo size={48} />
            <h1 className="text-3xl font-black text-white">zivv</h1>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1 text-sm">
            <button
              onClick={() => { setMode("signup"); setError(null); }}
              className={`rounded-xl py-2.5 font-semibold transition ${
                mode === "signup" ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white shadow" : "text-slate-300"
              }`}
            >
              حساب جديد
            </button>
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`rounded-xl py-2.5 font-semibold transition ${
                mode === "login" ? "bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white shadow" : "text-slate-300"
              }`}
            >
              تسجيل الدخول
            </button>
          </div>

          <h2 className="mb-1 text-xl font-bold text-white">
            {mode === "signup" ? "أهلاً بك في zivv 👋" : "مرحباً بعودتك ✨"}
          </h2>
          <p className="mb-5 text-sm text-slate-400">
            {mode === "signup"
              ? "أنشئ حسابك في ثوانٍ. اربطه بالبريد أو الهاتف لاسترداده عند الحاجة."
              : "سجّل دخولك باسمك الكامل وكلمة المرور."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="الاسم الأول" value={firstName} onChange={setFirstName} placeholder="أحمد" />
              <Field label="اسم العائلة" value={lastName} onChange={setLastName} placeholder="العلي" />
            </div>

            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-200">العمر</label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="مثال: 24"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                />
                <p className="mt-1 text-xs text-amber-300/80">⚠️ يجب أن يكون 18+</p>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-200">
                  البريد الإلكتروني أو رقم الهاتف
                  <span className="ms-2 text-[10px] text-slate-500">(اختياري - لاسترداد الحساب)</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl">
                    {idKind === "email" ? "📧" : idKind === "phone" ? "📱" : "📨"}
                  </span>
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com  أو  +9665XXXXXXXX"
                    dir="ltr"
                    className="w-full rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 ps-12 text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                {identifier && (
                  <p className="mt-1 text-[11px] text-emerald-300">
                    ✓ {idKind === "email" ? "بريد إلكتروني صالح" : "رقم هاتف دولي صالح"} — يمكنك استرداد حسابك عبره
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-200">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 pe-12 text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-200">تأكيد كلمة المرور</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-2xl border bg-slate-800/60 px-4 py-3 text-white outline-none focus:ring-2 ${
                    confirmPassword && confirmPassword !== password
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30"
                      : "border-white/10 focus:border-violet-500 focus:ring-violet-500/30"
                  }`}
                />
                {confirmPassword && confirmPassword === password && (
                  <p className="mt-1 text-[11px] text-emerald-300">✓ متطابقة</p>
                )}
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">اهتماماتك (اختياري)</label>
                <div className="flex flex-wrap gap-1.5">
                  {INTERESTS.map((i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => toggleInterest(i)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        interests.includes(i)
                          ? "border-violet-500 bg-violet-500/20 text-violet-200"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? "جارٍ المعالجة..."
                : mode === "signup"
                ? "إنشاء حساب والمتابعة"
                : "تسجيل الدخول"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            بإنشائك حساباً، فأنت توافق على شروط الاستخدام وسياسة الخصوصية في zivv.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-200">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
      />
    </div>
  );
}
