"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/db/schema";
import { Logo } from "./Logo";
import { ConfirmDialog } from "./ConfirmDialog";
import { NotificationBell } from "./NotificationBell";

type SafeUser = Omit<User, "passwordHash">;

const PRIMARY_NAV = [
  { href: "/feed", label: "الرئيسية", icon: "🏠" },
  { href: "/search", label: "البحث", icon: "🔍" },
  { href: "/chat", label: "الدردشة", icon: "💬" },
  { href: "/friends", label: "الأصدقاء", icon: "👥" },
  { href: "/status", label: "الحالات", icon: "🌟" },
];

const SECONDARY_NAV = [
  { href: "/smart", label: "الحل الذكي", icon: "🧠" },
  { href: "/shorts", label: "فيديوهات قصيرة", icon: "▶️" },
  { href: "/music", label: "الموسيقى", icon: "🎵" },
  { href: "/vault", label: "الخزنة", icon: "🔒" },
  { href: "/ai", label: "AI Studio", icon: "✨" },
];

export function AppShell({
  user,
  children,
}: {
  user: SafeUser | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const isAuthRoute = pathname === "/" || pathname === "/login" || pathname === "/signup";
  if (isAuthRoute || !user) {
    return <main className="min-h-screen">{children}</main>;
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setShowLogout(false);
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname?.startsWith(href + "/"));
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 lg:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="sticky top-0 z-30 hidden h-screen w-68 shrink-0 flex-col border-l border-white/5 bg-slate-950/95 backdrop-blur-xl lg:flex" style={{ width: "17rem" }}>
        <Link href="/feed" className="flex items-center gap-3 px-5 py-6">
          <Logo size={42} />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">zivv</h1>
            <p className="text-[10px] font-medium text-slate-400">تواصل · إبداع · أمان</p>
          </div>
        </Link>

        <Link
          href="/post"
          className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:shadow-xl hover:shadow-violet-500/40 gradient-animated"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
          <span>منشور جديد</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-gradient-to-l from-violet-500/20 to-fuchsia-500/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />
                )}
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <p className="mt-5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            المزيد
          </p>
          {SECONDARY_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-gradient-to-l from-violet-500/20 to-fuchsia-500/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-2 space-y-1 border-t border-white/5 p-3">
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-2.5 transition hover:bg-white/5"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${user.avatarColor || "from-violet-500 to-fuchsia-500"} text-sm font-bold text-white ring-2 ring-slate-900`}>
              {user.firstName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[10px] text-slate-400">عرض الملف الشخصي</p>
            </div>
            {user.showOnline && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 ring-2 ring-slate-900" title="متصل" />
            )}
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-base">⚙️</span>
            <span>الإعدادات</span>
          </Link>
          <button
            onClick={() => setShowLogout(true)}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <span className="text-base">🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-slate-950/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/feed" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-xl font-black text-white">zivv</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <Link
            href="/post"
            className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"
            aria-label="نشر"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
          </Link>
          <Link
            href="/settings"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-base hover:bg-white/10"
            aria-label="الإعدادات"
          >
            ⚙️
          </Link>
          <Link
            href={`/profile/${user.id}`}
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${user.avatarColor || "from-violet-500 to-fuchsia-500"} text-sm font-bold text-white ring-2 ring-slate-900`}
            aria-label="الملف الشخصي"
          >
            {user.firstName.charAt(0)}
          </Link>
          <button
            onClick={() => setShowLogout(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-rose-500/10 text-base text-rose-300 hover:bg-rose-500/20"
            aria-label="تسجيل الخروج"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="sticky bottom-0 z-30 grid grid-cols-5 gap-1 border-t border-white/5 bg-slate-950/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {PRIMARY_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] transition ${
                active
                  ? "bg-gradient-to-b from-violet-500/20 to-fuchsia-500/20 text-violet-200"
                  : "text-slate-400"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-0.5 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile FAB (more) */}
      <button
        onClick={() => setShowMore(true)}
        className="fixed bottom-20 left-4 z-20 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xl text-white shadow-xl shadow-violet-500/40 lg:hidden"
        aria-label="المزيد"
      >
        ☰
      </button>

      {showMore && (
        <div onClick={() => setShowMore(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden">
          <div onClick={(e) => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-white/10 bg-slate-900 p-4 fade-in">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />
            <h3 className="mb-3 px-2 text-sm font-semibold text-slate-300">المزيد</h3>
            <div className="grid grid-cols-2 gap-2">
              {SECONDARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-slate-200 hover:bg-white/10"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden pb-16 lg:pb-0">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>

      {showLogout && (
        <ConfirmDialog
          title="تسجيل الخروج؟"
          message="هل تريد فعلاً تسجيل الخروج من zivv؟"
          confirmLabel="نعم، تسجيل الخروج"
          onCancel={() => setShowLogout(false)}
          onConfirm={logout}
          variant="danger"
        />
      )}
    </div>
  );
}
