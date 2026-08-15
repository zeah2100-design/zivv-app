"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/db/schema";
import { formatTimeAgo } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";

type SafeUser = Omit<User, "passwordHash">;

type Tab = "verify" | "subscriptions" | "users" | "banned" | "settings";

type Request = {
  id: number;
  requesterId: number;
  firstName: string;
  lastName: string;
  avatarColor: string | null;
  bio: string | null;
  status: string;
  message: string | null;
  createdAt: string;
};

type UserRow = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  avatarColor: string | null;
  isMaster: boolean;
  isGolden: boolean;
  createdAt: string;
  lastSeen: string;
  isBanned?: boolean;
};

const MASTER_NAME = "زياد احمد صبحي";
const MASTER_AGE = 16;
const MASTER_BIRTH_DATE = "2010-09-09";
const MASTER_ANSWER = "زياد بيحب امه وابوه ولبرمجه";

// 100 options for the third question - the correct one is the MASTER_ANSWER
const MASTER_ANSWERS: string[] = [
  MASTER_ANSWER, // 1. Correct answer
  "البرمجة صعبة جداً ولا أحبها",
  "الذكاء الاصطناعي سيخفي وظائف كثيرة",
  "لست مهتماً بعلوم الحاسوب",
  "أفضل مشاهدة الأفلام على البرمجة",
  "لا أحب العمل على الكمبيوتر",
  "البرمجة مملة ومتعبة",
  "أكره الرياضيات والبرمجة معاً",
  "أعتقد أن التكنولوجيا ستندمّر مستقبلنا",
  "أفضل الرياضة على التكنولوجيا",
  "لا أملك صبر على حل المشاكل",
  "البرمجة للعباقرة فقط",
  "أخاف من التطور التكنولوجي",
  "أفضل الكتابة على البرمجة",
  "الكمبيوتر يجعلني أشعر بالصداع",
  "لا أحب الجلوس أمام الشاشة",
  "أفضّل العمل اليدوي على الرقمي",
  "أعتقد أن الإنترنت خطر",
  "أكره التعامل مع الأجهزة الحديثة",
  "أفضل العزلة على التواصل الرقمي",
  "أعيش بدون هاتف محمول",
  // 22-40
  "البرمجة حكر على المتخصصين فقط",
  "لا أرى مستقبلاً للتقنية في حياتي",
  "أفضّل العمل في الزراعة على البرمجة",
  "أعتقد أن الشاشات تضر بالعيون كثيراً",
  "لا أحب الأجهزة الإلكترونية",
  "أفضّل الرسم اليدوي على التصميم الرقمي",
  "أرى أن الذكاء الاصطناعي مجرد موضة",
  "لا أثق في التطبيقات الحديثة",
  "أفضّل الصحف الورقية على الرقمية",
  "أعتقد أن البرمجة تسبب الإدمان",
  "لا أرى فرقاً بين التطبيقات",
  "أكره الإشعارات على هاتفي",
  "أفضّل القراءة على الشاشات",
  "أعتقد أن الإنترنت أفسد التواصل البشري",
  "لا أحب الألعاب الإلكترونية",
  "أفضّل الموسيقى الحية على المسجلة",
  "أعتقد أن الكاميرات تنتهك الخصوصية",
  "لا أحب التسوق الإلكتروني",
  "أفضّل الرسائل النصية القصيرة",
  // 41-60
  "أعيش حياة بسيطة بدون تقنية",
  "البرمجة تأخذ وقتاً طويلاً جداً",
  "أفضّل الكتابة اليدوية على الطباعة",
  "أعتقد أن التكنولوجيا تقتل الإبداع",
  "لا أحب التعامل مع الأكواد المعقدة",
  "أفضّل الصمت على المحادثات الرقمية",
  "أعتقد أن التطبيقات تستهلك طاقتنا",
  "لا أرى فائدة من وسائل التواصل",
  "أفضّل الكتب الإلكترونية على الورقية",
  "أعتقد أن التكنولوجيا تزيد العزلة",
  "لا أحب التنبيهات والإشعارات",
  "أفضّل الطبيعة على المدينة الرقمية",
  "أعتقد أن الإنترنت يدمن",
  "لا أحب استخدام البطاقات الذكية",
  "أفضّل التواصل وجهًا لوجه",
  "أعتقد أن التكنولوجيا تسرق وظائفنا",
  "لا أحب البريد الإلكتروني",
  "أفضّل الرسائل الورقية على الإلكترونية",
  "أعتقد أن التكنولوجيا تعزلنا",
  "لا أحب الإعلانات على الإنترنت",
  // 61-80
  "أفضّل المحادثات الشخصية على الرقمية",
  "أعتقد أن التكنولوجيا تجعلنا كسالى",
  "لا أحب قراءة الأخبار على الإنترنت",
  "أفضّل المكتبات على المكتبات الرقمية",
  "أعتقد أن التطبيقات تسرق وقتنا",
  "لا أحب التسوق عبر الإنترنت",
  "أفضّل التواصل التقليدي",
  "أعتقد أن التكنولوجيا تقلل التواصل",
  "لا أحب الكاميرات في كل مكان",
  "أفضّل الهدوء على الضوضاء الرقمية",
  "أعتقد أن الإنترنت يفسد الأطفال",
  "لا أحب الأجهزة اللوحية",
  "أفضّل الأقلام على لوحات المفاتيح",
  "أعتقد أن التكنولوجيا تبتعدنا عن بعضنا",
  "لا أحب الساعات الذكية",
  "أفضّل الأقلام الورقية على الإلكترونية",
  "أعتقد أن التكنولوجيا تجعلنا أكثر وحدة",
  "لا أحب الكتب الصوتية",
  "أفضّل الكتب الورقية دائماً",
  "أعتقد أن الإنترنت يدمن الصغار",
  // 81-100
  "لا أحب الفيديوهات القصيرة",
  "أفضّل المطالعة العميقة على التصفح",
  "أعتقد أن التكنولوجيا تحرمنا الإبداع",
  "لا أحب البودكاست",
  "أفضّل الاستماع للموسيقى الحية",
  "أعتقد أن التطبيقات تجعلنا سطحيّين",
  "لا أحب الأخبار الفورية",
  "أفضّل التلفزيون على يوتيوب",
  "أعتقد أن التكنولوجيا تفسد الذاكرة",
  "لا أحب النشرات البريدية",
  "أفضّل الجرائد على المواقع الإخبارية",
  "أعتقد أن الإنترنت يدمن المراهقين",
  "لا أحب التعليقات السامة",
  "أفضّل القراءة المتأنية",
  "أعتقد أن التكنولوجيا تعطل التركيز",
  "لا أحب النوافذ المنبثقة",
  "أفضّل الصحف الورقية",
  "أعتقد أن التطبيقات تجعلنا سطحيّين جداً",
  "لا أحب المحتوى القصير",
  "أفضّل الكتب الكاملة على المقالات",
];

export function MasterPanel({ user, isMaster }: { user: SafeUser; isMaster: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(isMaster ? "subscriptions" : "verify");
  const [verifyStep, setVerifyStep] = useState<"name" | "age" | "date">("name");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [bannedUsers, setBannedUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmBan, setConfirmBan] = useState<UserRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const loadRequests = useCallback(async () => {
    if (!isMaster) return;
    setLoading(true);
    const res = await fetch("/api/subscriptions", { cache: "no-store" });
    const data = await res.json();
    setRequests(data.requests || []);
    setLoading(false);
  }, [isMaster]);

  const loadUsers = useCallback(async () => {
    if (!isMaster) return;
    const res = await fetch("/api/master/users", { cache: "no-store" });
    const data = await res.json();
    setUsers(data.users || []);
    setBannedUsers(data.banned || []);
  }, [isMaster]);

  useEffect(() => {
    if (isMaster) {
      loadRequests();
      loadUsers();
    }
  }, [isMaster, loadRequests, loadUsers]);

  function checkName() {
    setError(null);
    if (name.trim() !== MASTER_NAME) {
      setError("❌ الاسم غير مطابق. حاول مرة أخرى.");
      return;
    }
    setVerifyStep("age");
  }

  function checkAge() {
    setError(null);
    const ageNum = parseInt(age, 10);
    if (ageNum !== MASTER_AGE) {
      setError("❌ العمر غير مطابق.");
      return;
    }
    setVerifyStep("date");
  }

  async function checkDate() {
    setError(null);
    if (birthDate !== MASTER_ANSWER) {
      setError("❌ الإجابة غير صحيحة. حاول مرة أخرى.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/master/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: name.trim().split(" ")[0],
          lastName: name.trim().split(" ").slice(1).join(" "),
          secretPassword: "ذمرور",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل التحقق");
        setLoading(false);
        return;
      }
      setToast("✅ تم التحقق بنجاح! مرحباً أيها الملك 👑");
      setTimeout(() => {
        router.push("/master");
        router.refresh();
      }, 500);
    } catch {
      setError("فشل التحقق");
      setLoading(false);
    }
  }

  async function handleRequest(requestId: number, action: "approve" | "reject") {
    const res = await fetch("/api/subscriptions/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    if (res.ok) {
      setToast(action === "approve" ? "✅ تم قبول الطلب" : "❌ تم رفض الطلب");
      loadRequests();
    } else {
      const data = await res.json();
      setError(data.error || "فشل");
    }
  }

  async function handleBan(userId: number) {
    const res = await fetch("/api/master/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setToast("🚫 تم حظر الحساب");
      setConfirmBan(null);
      loadUsers();
    }
  }

  async function handleUnban(userId: number) {
    const res = await fetch("/api/master/ban", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setToast("✅ تم رفع الحظر");
      loadUsers();
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!isMaster) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-4xl shadow-xl shadow-amber-500/30">
            👑
          </div>
          <h1 className="text-2xl font-bold text-white">صفحة الملك الأساسي</h1>
          <p className="mt-2 text-sm text-slate-300">
            يجب الإجابة على 3 أسئلة للتحقق من هويتك
          </p>
          <p className="mt-1 text-[10px] text-amber-300/70">
            ⚠️ هذه الصفحة محظورة على الجميع ما عدا المؤسس
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
        )}

        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          {verifyStep === "name" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-500/20 text-amber-300">1</div>
                <h3 className="text-sm font-semibold text-white">السؤال الأول: ما اسم الملك الأساسي الثلاثي؟</h3>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اكتب الاسم الثلاثي هنا"
                className="w-full rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-slate-100 outline-none focus:border-amber-500"
              />
              <button
                onClick={checkName}
                className="w-full rounded-2xl bg-gradient-to-l from-amber-500 to-orange-500 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30"
              >
                تحقق ←
              </button>
            </div>
          )}

          {verifyStep === "age" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-500/20 text-amber-300">2</div>
                <h3 className="text-sm font-semibold text-white">السؤال الثاني: كم كان عمر المستخدم الأساسي عند إنشاء التطبيق؟</h3>
              </div>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="عمره عند الإنشاء"
                className="w-full rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-slate-100 outline-none focus:border-amber-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setVerifyStep("name")}
                  className="flex-1 rounded-2xl bg-white/5 py-3 text-sm text-slate-300"
                >
                  رجوع
                </button>
                <button
                  onClick={checkAge}
                  className="flex-1 rounded-2xl bg-gradient-to-l from-amber-500 to-orange-500 py-3 text-sm font-semibold text-white"
                >
                  تحقق ←
                </button>
              </div>
            </div>
          )}

          {verifyStep === "date" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-500/20 text-amber-300">3</div>
                <h3 className="text-sm font-semibold text-white">
                  السؤال الثالث: اختر الجملة الصحيحة من 100 جملة
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                ⚠️ هذا هو السؤال الأخير. اختر الإجابة الصحيحة للمتابعة
              </p>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-slate-800/60 p-2 space-y-1.5">
                {MASTER_ANSWERS.map((ans, i) => (
                  <button
                    key={i}
                    onClick={() => setBirthDate(ans)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-right text-sm transition ${
                      birthDate === ans
                        ? "border-amber-500 bg-amber-500/20 text-amber-100"
                        : "border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <span className="ms-2 text-xs text-slate-500">{i + 1}.</span>
                    {ans}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setVerifyStep("age")}
                  className="flex-1 rounded-2xl bg-white/5 py-3 text-sm text-slate-300"
                >
                  رجوع
                </button>
                <button
                  onClick={checkDate}
                  disabled={!birthDate || loading}
                  className="flex-1 rounded-2xl bg-gradient-to-l from-amber-500 to-orange-500 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 disabled:opacity-50"
                >
                  {loading ? "..." : "👑 دخول"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2">
            {(["name", "age", "date"] as const).map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${
                  (["name", "age", "date"] as const).indexOf(verifyStep) >= i ? "bg-amber-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-3xl shadow-lg shadow-amber-500/40">
            👑
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">لوحة الملك</h1>
            <p className="text-sm text-amber-200/80">مرحباً يا {MASTER_NAME}</p>
            <p className="text-[10px] text-amber-300/50">{MASTER_AGE} سنة · {MASTER_BIRTH_DATE}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/feed" className="rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10">
            🏠 الرئيسية
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/25"
          >
            🚪 خروج
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard icon="📋" label="طلبات معلقة" value={pendingCount} active={tab === "subscriptions"} onClick={() => setTab("subscriptions")} />
        <StatCard icon="👥" label="مستخدمين" value={users.length} active={tab === "users"} onClick={() => setTab("users")} />
        <StatCard icon="🚫" label="محظورين" value={bannedUsers.length} active={tab === "banned"} onClick={() => setTab("banned")} danger />
        <StatCard icon="⚙️" label="إعدادات" value="" active={tab === "settings"} onClick={() => setTab("settings")} />
      </div>

      {tab === "subscriptions" && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-slate-400">جاري التحميل...</p>
          ) : requests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
              <p className="text-slate-400">لا توجد طلبات اشتراك</p>
            </div>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                className={`rounded-2xl border p-4 ${
                  r.status === "pending"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : r.status === "approved"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-rose-500/30 bg-rose-500/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${r.avatarColor || "from-teal-500 to-cyan-500"} text-base font-bold text-white`}>
                    {r.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{r.firstName} {r.lastName}</p>
                    <p className="text-xs text-slate-400">{r.bio || "بدون نبذة"}</p>
                    {r.message && <p className="mt-1 text-xs text-slate-300">💬 {r.message}</p>}
                    <p className="mt-1 text-[10px] text-slate-500">{formatTimeAgo(r.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === "pending" ? "bg-amber-500/20 text-amber-200" :
                      r.status === "approved" ? "bg-emerald-500/20 text-emerald-200" :
                      "bg-rose-500/20 text-rose-200"
                    }`}>
                      {r.status === "pending" ? "⏳ معلق" : r.status === "approved" ? "✓ مقبول" : "✗ مرفوض"}
                    </span>
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRequest(r.id, "approve")}
                          className="rounded-lg bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
                        >
                          ✓ قبول
                        </button>
                        <button
                          onClick={() => handleRequest(r.id, "reject")}
                          className="rounded-lg bg-rose-500/20 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/30"
                        >
                          ✗ رفض
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="text-center text-slate-400">لا يوجد مستخدمين</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${u.avatarColor || "from-teal-500 to-cyan-500"} text-sm font-bold text-white`}>
                  {u.firstName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-white">{u.firstName} {u.lastName}</p>
                    {u.isMaster && <span title="الملك">👑</span>}
                    {u.isGolden && <span title="ذهبي" className="text-xs">⭐</span>}
                  </div>
                  <p className="text-[10px] text-slate-500">#{u.id} · {u.email || u.phone || "بدون تواصل"}</p>
                </div>
                <div className="flex items-center gap-1">
                  {u.isMaster ? (
                    <span className="rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] text-amber-300">👑 Master</span>
                  ) : (
                    <button
                      onClick={() => setConfirmBan(u)}
                      className="rounded-lg bg-rose-500/15 px-2 py-1 text-[10px] text-rose-300 hover:bg-rose-500/25"
                    >
                      🚫 حظر
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "banned" && (
        <div className="space-y-2">
          {bannedUsers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
              <p className="text-3xl">✅</p>
              <p className="mt-2 text-slate-400">لا يوجد حسابات محظورة</p>
            </div>
          ) : (
            bannedUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${u.avatarColor || "from-rose-500 to-red-500"} text-sm font-bold text-white opacity-60`}>
                  🚫
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-slate-500">#{u.id} · محظور</p>
                </div>
                <button
                  onClick={() => handleUnban(u.id)}
                  className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/25"
                >
                  رفع الحظر
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-3">
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="mb-2 text-sm font-semibold text-amber-200">🔐 بيانات الملك الأساسية</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p>👑 الاسم: <span className="text-white">{MASTER_NAME}</span></p>
              <p>🎂 العمر عند الإنشاء: <span className="text-white">{MASTER_AGE} سنة</span></p>
              <p>📅 تاريخ الميلاد: <span className="text-white">{MASTER_BIRTH_DATE}</span></p>
              <p>🔑 كلمة السر السرية: <span className="text-white">ذمرور</span></p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5">
            <h3 className="mb-2 text-sm font-semibold text-white">⚡ صلاحيات الملك</h3>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>✅ قبول/رفض طلبات الاشتراك الذهبي</li>
              <li>✅ حظر أي حساب على التطبيق</li>
              <li>✅ رفع الحظر</li>
              <li>✅ الوصول لجميع الإحصائيات</li>
              <li>✅ لون ذهبي مميز 👑</li>
            </ul>
          </div>
        </div>
      )}

      {confirmBan && (
        <ConfirmDialog
          title={`حظر ${confirmBan.firstName} ${confirmBan.lastName}؟`}
          message="لن يستطيع هذا المستخدم الدخول للتطبيق حتى يتم رفع الحظر."
          confirmLabel="نعم، حظر"
          variant="danger"
          onCancel={() => setConfirmBan(null)}
          onConfirm={() => handleBan(confirmBan.id)}
        />
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-50 mx-auto w-fit rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-2.5 text-sm text-white shadow-2xl backdrop-blur lg:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, active, onClick, danger }: { icon: string; label: string; value: number | string; active: boolean; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-center transition ${
        active
          ? danger
            ? "border-rose-500 bg-rose-500/10"
            : "border-amber-500 bg-amber-500/10"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <p className="text-2xl">{icon}</p>
      {value !== "" && <p className="mt-1 text-2xl font-bold text-white">{value}</p>}
      <p className="text-xs text-slate-400">{label}</p>
    </button>
  );
}
