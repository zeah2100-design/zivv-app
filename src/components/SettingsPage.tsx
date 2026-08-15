"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/db/schema";
import { AVATAR_PALETTE } from "@/lib/utils";

type SafeUser = Omit<User, "passwordHash">;

export function SettingsPage({ user }: { user: SafeUser }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [bio, setBio] = useState(user.bio || "");
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || AVATAR_PALETTE[0]);
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [theme, setTheme] = useState<"light" | "dark" | "auto">(user.theme || "dark");
  const [showOnline, setShowOnline] = useState(user.showOnline ?? true);
  const [contentFilter, setContentFilter] = useState(user.contentFilter ?? true);
  const [parentalControl, setParentalControl] = useState(user.parentalControl ?? false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleInterest(i: string) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const body: Record<string, unknown> = {
      firstName, lastName, bio, avatarColor, interests, theme, showOnline, contentFilter, parentalControl,
    };
    if (newPwd) {
      body.currentPassword = currentPwd;
      body.newPassword = newPwd;
    }
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      setMsg({ type: "err", text: data.error || "فشل الحفظ" });
      return;
    }
    setMsg({ type: "ok", text: "تم الحفظ بنجاح ✓" });
    setCurrentPwd("");
    setNewPwd("");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">⚙️ الإعدادات</h1>
        <p className="mt-1 text-sm text-slate-400">إدارة حسابك وميزاتك في zivv</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {user.isGolden && (
            <Link
              href="/settings/perks"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-gradient-to-l from-amber-500/20 to-orange-500/20 px-4 py-2 text-sm font-semibold text-amber-300 hover:from-amber-500/30"
            >
              <span>⭐</span>
              <span>ميزات النسخة الذهبية</span>
            </Link>
          )}
          <Link
            href="/master"
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-gradient-to-l from-amber-500/10 to-orange-500/10 px-4 py-2 text-sm font-semibold text-amber-300"
          >
            <span>👑</span>
            <span>أنا الملك الأساسي</span>
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {[
            { k: "general", l: "👤 عام" },
            { k: "privacy", l: "🔒 الخصوصية" },
            { k: "safety", l: "🛡️ الأمان" },
            { k: "content", l: "🎯 المحتوى" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => {
                const el = document.getElementById(`section-${t.k}`);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="shrink-0 rounded-2xl bg-white/5 px-4 py-3 text-right text-sm font-medium text-slate-300 transition hover:bg-white/10"
            >
              {t.l}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          {user.isGolden && (
            <div id="section-golden" className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl">⭐</div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">النسخة الذهبية مفعّلة</h3>
                  <p className="text-xs text-amber-200/80">استمتع بميزات حصرية بدون إعلانات</p>
                </div>
                <Link
                  href="/settings/perks"
                  className="rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/30"
                >
                  ⚙️ إدارة
                </Link>
              </div>
            </div>
          )}

          <Section id="section-general" title="البيانات الشخصية">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الاسم الأول" value={firstName} onChange={setFirstName} placeholder="أحمد" />
              <Field label="اسم العائلة" value={lastName} onChange={setLastName} placeholder="العلي" />
            </div>
            <div className="mt-3">
              <label className="mb-1.5 block text-sm text-slate-200">نبذة عنك</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-800/50 p-3 text-slate-100 outline-none focus:border-teal-500"
                placeholder="تحدث عن نفسك..."
              />
            </div>
            <div className="mt-3">
              <label className="mb-1.5 block text-sm text-slate-200">لون الملف الشخصي</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAvatarColor(c)}
                    className={`h-9 w-9 rounded-full bg-gradient-to-br ${c} ring-2 ${avatarColor === c ? "ring-white" : "ring-transparent"}`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-2 block text-sm text-slate-200">الاهتمامات</label>
              <div className="flex flex-wrap gap-1.5">
                {["تكنولوجيا", "فن", "موسيقى", "رياضة", "تعليم", "سفر", "طبخ", "أفلام"].map((i) => (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      interests.includes(i)
                        ? "border-teal-500 bg-teal-500/20 text-teal-200"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section id="section-privacy" title="الخصوصية">
            <Toggle
              label="إظهار حالة 'متصل'"
              desc="السماح للآخرين بمعرفة متى تكون متصلاً"
              checked={showOnline}
              onChange={setShowOnline}
            />
          </Section>

          <Section id="section-safety" title="الأمان">
            <Toggle
              label="الرقابة الأبوية"
              desc="منع المحتوى غير المناسب وفلترة التعليقات"
              checked={parentalControl}
              onChange={setParentalControl}
            />
            <div className="mt-3">
              <Field label="كلمة المرور الحالية" value={currentPwd} onChange={setCurrentPwd} type="password" />
              <div className="mt-3">
                <Field label="كلمة المرور الجديدة" value={newPwd} onChange={setNewPwd} type="password" />
              </div>
            </div>
          </Section>

          <Section id="section-content" title="المحتوى">
            <Toggle
              label="فحص المحتوى قبل النشر"
              desc="استخدام AI لفحص النصوص"
              checked={contentFilter}
              onChange={setContentFilter}
            />
          </Section>

          {msg && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                msg.type === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy}
              className="flex-1 rounded-2xl bg-gradient-to-l from-teal-600 to-cyan-600 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 disabled:opacity-50"
            >
              {busy ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
            <button
              onClick={logout}
              className="rounded-2xl bg-rose-500/15 px-5 py-3 text-sm text-rose-300 hover:bg-rose-500/25"
            >
              🚪 خروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="rounded-3xl border border-white/5 bg-slate-900/60 p-5 scroll-mt-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500"
      />
    </div>
  );
}

function Toggle({ label, desc, checked, onChange, disabled = false }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-100">{label}</p>
        <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-teal-500" : "bg-white/10"} ${disabled ? "opacity-50" : ""}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "right-0.5" : "right-[1.375rem]"}`}
        />
      </button>
    </div>
  );
}
