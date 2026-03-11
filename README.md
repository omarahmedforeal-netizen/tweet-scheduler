# Postlate - جدولة التغريدات

## نظرة عامة

تطبيق ويب لجدولة ونشر التغريدات بشكل تلقائي مع ترجمة بالذكاء الاصطناعي ودعم الثريدات. مبني بـ Next.js 14 و Upstash Redis.

## المميزات

- جدولة تغريدات مع calendar view (اليوم/غداً/بعد غد)
- 4 فترات زمنية: صباحاً (09:00) / ظهراً (12:00) / عصراً (16:00) / مساءً (20:00)
- ترجمة تلقائية بالذكاء الاصطناعي (سعودي/مصري/فصحى/إنجليزي/فرنسي)
- دعم الثريدات (تغريدات متسلسلة)
- جلب نص تغريدة من رابط
- نشر فوري أو مجدول
- إشعارات تلغرام عند النشر/الفشل
- تحكم بالكتلة (حذف/نشر مجموعة)
- بحث وفلترة حسب الحالة
- وضع مظلم/فاتح
- تصميم متجاوب (Desktop + Mobile)
- واجهة عربية RTL بالكامل

## التقنيات

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Upstash Redis (تخزين البيانات)
- Twitter API v2 (نشر التغريدات)
- OpenAI API (ترجمة بالذكاء الاصطناعي)
- Telegram Bot API (إشعارات)
- Vercel Cron Jobs (جدولة تلقائية)

## التثبيت

```bash
git clone https://github.com/omarahmedforeal-netizen/tweet-scheduler.git
cd tweet-scheduler
npm install
```

## المتغيرات البيئية

أنسخ `.env.example` إلى `.env.local`:

```bash
cp .env.example .env.local
```

المتغيرات المطلوبة:

| المتغير | الوصف |
|---------|-------|
| TWITTER_API_KEY | مفتاح Twitter API |
| TWITTER_API_SECRET | سر Twitter API |
| TWITTER_ACCESS_TOKEN | توكن الوصول |
| TWITTER_ACCESS_SECRET | سر توكن الوصول |
| OPENAI_API_KEY | مفتاح OpenAI للترجمة |
| UPSTASH_REDIS_REST_URL | رابط Upstash Redis |
| UPSTASH_REDIS_REST_TOKEN | توكن Upstash Redis |
| CRON_SECRET | سر لحماية الـ cron endpoint |
| TELEGRAM_BOT_TOKEN | توكن بوت تلغرام للإشعارات |
| TELEGRAM_CHAT_ID | معرف المحادثة بتلغرام |

## هيكل المشروع

```
src/
├── app/
│   ├── api/
│   │   ├── cron/          # Cron job - فحص ونشر التغريدات المجدولة
│   │   ├── fetch-tweet/   # جلب نص تغريدة من رابط
│   │   ├── post-tweet/    # نشر تغريدة فوراً
│   │   ├── schedule/      # CRUD عمليات الجدولة
│   │   └── translate/     # ترجمة بالذكاء الاصطناعي
│   ├── globals.css        # الأنماط العامة
│   ├── layout.tsx         # التخطيط الرئيسي
│   └── page.tsx           # الصفحة الرئيسية (Dashboard)
├── lib/
│   └── redis.ts           # اتصال Upstash Redis
public/
├── i18n.json              # ملف الترجمة العربية
data/
└── scheduled.json         # بيانات احتياطية
```

## API Endpoints

| Endpoint | Method | الوصف |
|----------|--------|-------|
| /api/schedule | GET | جلب كل التغريدات المجدولة |
| /api/schedule | POST | جدولة تغريدة جديدة |
| /api/schedule | PUT | تعديل تغريدة مجدولة |
| /api/schedule | DELETE | حذف تغريدة (أو مجموعة) |
| /api/post-tweet | POST | نشر تغريدة فوراً |
| /api/fetch-tweet | POST | جلب نص من رابط تغريدة |
| /api/translate | POST | ترجمة نص |
| /api/cron | GET | فحص ونشر التغريدات المستحقة |

## النشر على Vercel

1. ارفع المشروع على GitHub
2. اربطه بـ Vercel
3. أضف المتغيرات البيئية
4. الـ Cron job يعمل تلقائياً كل 5 دقائق عبر `vercel.json`

## الترخيص

MIT
