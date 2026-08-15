"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/db/schema";

type SafeUser = Omit<User, "passwordHash">;

type Perks = {
  customAvatar: boolean;
  verifiedBadge: boolean;
  unlimitedStorage: boolean;
  customThemes: boolean;
  prioritySupport: boolean;
  noAds: boolean;
  advancedAnalytics: boolean;
  unlimitedFriends: boolean;
  chatThemes: boolean;
  customStatusDuration: boolean;
} | null;

const PERK_LIST = [
  { key: "customAvatar", icon: "📸", title: "صورة بروفايل مخصصة", desc: "ارفع صورتك الخاصة من جهازك" },
  { key: "verifiedBadge", icon: "✓", title: "شارة التحقق", desc: "علامة ✓ بجانب اسمك" },
  { key: "unlimitedStorage", icon: "💾", title: "مساحة تخزين غير محدودة", desc: "ارفع صور وفيديوهات بلا حدود" },
  { key: "customThemes", icon: "🎨", title: "ثيمات مخصصة", desc: "خصص مظهر التطبيق بالكامل" },
  { key: "prioritySupport", icon: "⚡", title: "دعم فني سريع", desc: "رد على مشاكلك خلال ساعة" },
  { key: "noAds", icon: "🚫", title: "بدون إعلانات", desc: "تجربة نظيفة 100%" },
  { key: "advancedAnalytics", icon: "📊", title: "إحصائيات متقدمة", desc: "تتبع أداء منشوراتك بدقة" },
  { key: "unlimitedFriends", icon: "👥", title: "أصدقاء غير محدودين", desc: "أضف ما تريد من الأصدقاء" },
  { key: "chatThemes", icon: "💬", title: "ثيمات الدردشة", desc: "خصص مظهر المحادثات" },
  { key: "customStatusDuration", icon: "⏰", title: "مدة حالات مخصصة", desc: "اختر كم تدوم حالاتك" },
];

export function PerksPage({ user, perks: initialPerks }: { user: SafeUser; perks: NonNullable<Perks> | null }) {
  const router = useRouter();
  const [perks, setPerks] = useState<NonNullable<Perks> | null>(initialPerks);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<"teal" | "gold" | "ocean" | "sunset">("teal");

  async function togglePerk(key: keyof NonNullable<Perks>) {
    if (!perks) return;
    const newPerks = { ...perks, [key]: !perks[key] };
    setPerks(newPerks);
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/perks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newPerks[key] }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setPerks(perks);
    }
    setSaving(false);
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("الصورة كبيرة جداً (الحد 5MB)");
      return;
    }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
      setAvatarUploading(false);
      alert("✅ تم رفع الصورة (محاكاة - تحتاج API endpoint للحفظ)");
    };
    reader.readAsDataURL(f);
  }

  if (!user.isGolden) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-4xl shadow-xl shadow-amber-500/30">
            ⭐
          </div>
          <h1 className="text-2xl font-bold text-white">ميزات النسخة الذهبية</h1>
          <p className="mt-2 text-sm text-slate-300">احصل على ميزات حصرية بالاشتراك في النسخة الذهبية</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PERK_LIST.map((p) => (
            <div key={p.key} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{p.icon}</span>
                <p className="text-sm font-semibold text-white">{p.title}</p>
              </div>
              <p className="mt-1 text-xs text-slate-400">{p.desc}</p>
            </div>
          ))}
        </div>

        <Link
          href="/profile/1"
          className="block w-full rounded-2xl bg-gradient-to-l from-amber-500 to-orange-500 py-3 text-center text-sm font-bold text-white shadow-lg shadow-amber-500/30"
        >
          ⭐ اطلب اشتراك ذهبي الآن
        </Link>
        <Link
          href="/settings"
          className="block text-center text-sm text-slate-400 hover:text-white"
        >
          ← العودة للإعدادات
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-3xl shadow-lg shadow-amber-500/30">
            ⭐
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">النسخة الذهبية</h1>
            <p className="text-sm text-amber-200/80">مدعوم من zivv</p>
          </div>
        </div>
        {saved && <p className="mt-2 text-center text-xs text-emerald-300">✓ تم الحفظ</p>}
        {saving && <p className="mt-2 text-center text-xs text-amber-300">⏳ جاري الحفظ...</p>}
      </div>

      {/* Custom Avatar Upload */}
      {perks?.customAvatar && (
        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">📸 صورة بروفايل مخصصة</h3>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          <div className="flex items-center gap-4">
            <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${user.avatarColor || "from-teal-500 to-cyan-500"} text-2xl font-bold text-white shadow-lg overflow-hidden`}>
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : user.firstName.charAt(0)}
            </div>
            <div className="flex-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50"
              >
                {avatarUploading ? "⏳ جاري الرفع..." : "📤 ارفع صورة"}
              </button>
              <p className="mt-1 text-[10px] text-slate-500">PNG, JPG حتى 5MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Theme Selector */}
      {perks?.customThemes && (
        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">🎨 ثيم مخصص</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: "teal", g: "from-teal-500 to-cyan-500" },
              { v: "gold", g: "from-amber-400 to-orange-500" },
              { v: "ocean", g: "from-cyan-500 to-blue-600" },
              { v: "sunset", g: "from-rose-500 to-orange-500" },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setTheme(t.v as typeof theme)}
                className={`h-14 rounded-2xl bg-gradient-to-br ${t.g} ring-2 transition ${
                  theme === t.v ? "ring-white" : "ring-transparent hover:ring-white/30"
                }`}
                title={t.v}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">الثيم الحالي: {theme}</p>
        </div>
      )}

      {/* Perks Toggles */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">⚙️ تفعيل/إيقاف الميزات</h3>
        <div className="space-y-2">
          {PERK_LIST.slice(0, 8).map((p) => {
            const enabled = (perks as Record<string, boolean>)?.[p.key] ?? false;
            return (
              <div key={p.key} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.title}</p>
                    <p className="text-[10px] text-slate-400">{p.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePerk(p.key as keyof NonNullable<Perks>)}
                  disabled={saving}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    enabled ? "bg-amber-500" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      enabled ? "right-0.5" : "right-[1.375rem]"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Link
        href="/settings"
        className="block text-center text-sm text-slate-400 hover:text-white"
      >
        ← العودة للإعدادات
      </Link>
    </div>
  );
}
