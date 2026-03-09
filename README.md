# Tweet Scheduler - مجدول التغريدات

تطبيق Next.js 14 لجلب التغريدات وترجمتها إلى عدة لغات ولهجات وجدولة نشرها.

## الميزات

- **جلب التغريدات** من رابط Twitter/X عبر oEmbed API (مع fallback لـ Syndication API)
- **ترجمة متعددة اللغات** باستخدام GPT-4o:
  - اللهجة السعودية العامية
  - اللهجة المصرية العامية
  - العربية الفصحى
  - English
  - Francais
- **جدولة النشر** في وقت محدد مع cron خارجي
- **نشر فوري** بضغطة زر مع تأكيد
- **حذف التغريدات** مع تأكيد
- **عداد الأحرف** (حد 280 حرف لتويتر)
- **إشعارات Toast** متحركة تختفي تلقائياً
- واجهة عربية داكنة (RTL) بتصميم Glass Morphism

## التثبيت

```bash
npm install
cp .env.example .env.local
# عدّل .env.local وأضف مفاتيح API
npm run dev
```

## متغيرات البيئة (.env.local)

```env
OPENAI_API_KEY=sk-...
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
CRON_SECRET=any_random_secret   # اختياري - لحماية endpoint الكرون
```

## هيكل المشروع

```
tweet-scheduler/
├── src/app/
│   ├── page.tsx                    <- الواجهة الرئيسية
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── fetch-tweet/route.ts    <- جلب نص التغريدة (oEmbed + Syndication)
│       ├── translate/route.ts      <- الترجمة متعددة اللغات بـ OpenAI
│       ├── schedule/route.ts       <- CRUD التغريدات المجدولة
│       ├── post-tweet/route.ts     <- النشر على X
│       └── cron/route.ts           <- تشغيل المجدول
├── src/lib/
│   ├── types.ts                    <- الأنواع المشتركة (ScheduledTweet)
│   ├── data.ts                     <- قراءة/كتابة JSON المشتركة
│   └── scheduler.ts               <- منطق المجدول التلقائي
└── data/
    └── scheduled.json             <- ملف التخزين المحلي
```

## API Endpoints

| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/fetch-tweet` | جلب نص تغريدة من رابط |
| POST | `/api/translate` | ترجمة نص (مع اختيار اللغة) |
| GET | `/api/schedule` | قائمة التغريدات المجدولة |
| POST | `/api/schedule` | إضافة تغريدة مجدولة |
| PATCH | `/api/schedule` | تحديث حالة تغريدة |
| DELETE | `/api/schedule` | حذف تغريدة |
| POST | `/api/post-tweet` | نشر تغريدة فوراً |
| GET | `/api/cron?secret=...` | تشغيل المجدول |

## تشغيل المجدول التلقائي

استدعِ `/api/cron?secret=YOUR_CRON_SECRET` كل دقيقة باستخدام:
- **Vercel Cron Jobs** (في `vercel.json`)
- **cron-job.org** (مجاني)
- أي خدمة cron خارجية

## ملاحظات

- يتطلب Twitter Developer Account بصلاحيات Read & Write
- يستخدم `data/scheduled.json` للتخزين (مناسب للتطوير، استخدم قاعدة بيانات للإنتاج)
- جلب التغريدات يستخدم Twitter oEmbed API (مجاني، بدون مصادقة) مع fallback لـ Syndication API
- الترجمة تدعم 5 لغات/لهجات مع GPT-4o
