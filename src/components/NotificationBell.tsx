"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  fromUserId: number | null;
  fromFirstName: string | null;
  fromLastName: string | null;
  fromAvatarColor: string | null;
};

const NOTIF_ICONS: Record<string, string> = {
  friend_request: "👥",
  message: "💬",
  like: "❤️",
  comment: "💭",
  golden_request: "⭐",
  golden_approved: "🎉",
  golden_rejected: "❌",
  status_view: "👁",
  post_like: "❤️",
  post_comment: "💭",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    load();
    // Real-time polling every 5 seconds
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/notifications", { method: "POST" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setLoading(false);
  }

  async function markRead(id: number) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds: [id] }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function clearAll() {
    if (!confirm("حذف كل الإشعارات؟")) return;
    await fetch("/api/notifications", { method: "DELETE" });
    setNotifications([]);
    setUnreadCount(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative grid h-9 w-9 place-items-center rounded-full bg-white/5 text-base hover:bg-white/10"
        aria-label="الإشعارات"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-11 z-50 w-80 max-h-[500px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/5 p-3">
            <p className="text-sm font-semibold text-white">الإشعارات {unreadCount > 0 && <span className="ms-1 text-violet-300">({unreadCount})</span>}</p>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} disabled={loading} className="text-[10px] text-violet-300 hover:text-violet-200">
                  ✓ قراءة الكل
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] text-rose-300 hover:text-rose-200">
                  🗑 حذف
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-3xl">🔔</p>
                <p className="mt-2 text-sm text-slate-400">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => {
                    if (!n.isRead) markRead(n.id);
                    setOpen(false);
                  }}
                  className={`flex items-start gap-2 border-b border-white/5 p-3 last:border-0 transition ${
                    n.isRead ? "bg-transparent" : "bg-violet-500/5"
                  } hover:bg-white/5`}
                >
                  <div className="text-2xl">{NOTIF_ICONS[n.type] || "🔔"}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {n.fromFirstName && (
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${n.fromAvatarColor || "from-violet-500 to-fuchsia-500"} text-[10px] font-bold text-white`}>
                          {n.fromFirstName.charAt(0)}
                        </div>
                      )}
                      <p className="truncate text-xs font-semibold text-white">{n.title}</p>
                      {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                    </div>
                    {n.body && <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">{n.body}</p>}
                    <p className="mt-0.5 text-[10px] text-slate-500">{formatTimeAgo(n.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
