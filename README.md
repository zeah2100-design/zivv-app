# zivv - منصة التواصل الاجتماعي الذكية

منصة تواصل اجتماعي متكاملة مع ذكاء اصطناعي (Groq + xAI) ومحادثات حقيقية.

## المميزات

- ✅ **تسجيل دخول** بالاسم + كلمة المرور
- ✅ **نشر** (نص، صور، فيديو) + ضغط تلقائي
- ✅ **دردشة حقيقية** بين المستخدمين (real-time polling)
- ✅ **مكالمات** صوتية وفيديو في المحادثات
- ✅ **AI Studio** - دردشة ذكية + إنشاء صور بـ Grok Aurora
- ✅ **صفحة Master** - تحكم كامل (للمؤسس فقط)
- ✅ **إشعارات فورية** (real-time)
- ✅ **نسخة ذهبية** بميزات حصرية
- ✅ **حالات (Stories)** - نص/صورة/فيديو مع تخصيص كامل
- ✅ **الحل الذكي** - توصيات + إحصائيات

## التقنيات

- **Next.js 16** (App Router)
- **TypeScript**
- **PostgreSQL** + **Drizzle ORM**
- **Tailwind CSS**
- **Groq AI** (Llama 3.3 70B)
- **xAI Aurora** (Grok - image generation)
- **WebRTC** (camera/mic for calls)

## النشر على Vercel

1. Fork هذا المشروع
2. سجل في [Vercel](https://vercel.com)
3. Import المشروع
4. أضف متغير البيئة: `DATABASE_URL` (من Neon أو Supabase)
5. Deploy!

## تشغيل محلي

```bash
npm install
# أضف DATABASE_URL في .env
npm run build
npm start
```

## حساب Master الافتراضي

- الاسم: `زياد احمد صبحي`
- العمر: `16`
- كلمة المرور: `demo1234`

## الترخيص

MIT
