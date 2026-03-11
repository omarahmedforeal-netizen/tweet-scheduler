/**
 * Telegram Bot Webhook Handler for Postlate Tweet Scheduler
 * 
 * Commands:
 *   /start        - Welcome message with bot overview
 *   /help         - Show all available commands
 *   /list         - List all scheduled tweets
 *   /pending      - Show only pending tweets
 *   /posted       - Show posted tweets
 *   /failed       - Show failed tweets
 *   /schedule     - Schedule a new tweet (interactive)
 *   /quick <text> - Quick schedule a tweet for next slot
 *   /post <id>    - Post a specific tweet immediately
 *   /delete <id>  - Delete a scheduled tweet
 *   /edit <id>    - Edit a tweet's text
 *   /translate    - Translate text using AI
 *   /status       - System status overview
 *   /webhook      - Setup webhook (admin)
 * 
 * Callback queries handle inline keyboard interactions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { readTweets, writeTweets } from '@/lib/data'
import type { ScheduledTweet } from '@/lib/types'
import {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
  isAuthorized,
  setWebhook,
  escapeHtml,
  formatDate,
  formatStatus,
  truncateText,
  type TelegramUpdate,
  type InlineKeyboardMarkup,
} from '@/lib/telegram'

// ─── Webhook endpoint (POST from Telegram) ───────────────────

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json()

    // Handle callback queries (inline keyboard buttons)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query)
      return NextResponse.json({ ok: true })
    }

    // Handle text messages
    if (update.message?.text) {
      await handleMessage(update.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Telegram Bot] Error processing update:', err)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}

// ─── Webhook setup endpoint (GET) ────────────────────────────

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
  if (!baseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_BASE_URL not set' }, { status: 500 })
  }

  const webhookUrl = `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/telegram`
  const result = await setWebhook(webhookUrl)

  return NextResponse.json({
    success: result,
    webhook_url: webhookUrl,
  })
}

// ─── Message Handler ─────────────────────────────────────────

async function handleMessage(message: TelegramUpdate['message'] & {}) {
  const chatId = message.chat.id
  const text = message.text || ''
  const userId = message.from?.id

  // Authorization check
  if (!isAuthorized(chatId)) {
    await sendMessage(chatId, '\u26D4 غير مصرح لك باستخدام هذا البوت.')
    return
  }

  // Parse command
  const [command, ...args] = text.split(' ')
  const cmd = command.toLowerCase().replace('@postlate_bot', '') // Remove bot mention

  switch (cmd) {
    case '/start':
      await handleStart(chatId)
      break
    case '/help':
      await handleHelp(chatId)
      break
    case '/list':
      await handleList(chatId, 'all')
      break
    case '/pending':
      await handleList(chatId, 'pending')
      break
    case '/posted':
      await handleList(chatId, 'posted')
      break
    case '/failed':
      await handleList(chatId, 'failed')
      break
    case '/schedule':
      await handleScheduleStart(chatId)
      break
    case '/quick':
      await handleQuickSchedule(chatId, args.join(' '))
      break
    case '/post':
      await handlePostTweet(chatId, args[0])
      break
    case '/delete':
      await handleDeleteTweet(chatId, args[0])
      break
    case '/edit':
      await handleEditTweet(chatId, args[0], args.slice(1).join(' '))
      break
    case '/translate':
      await handleTranslate(chatId, args.join(' '))
      break
    case '/status':
      await handleStatus(chatId)
      break
    case '/retry':
      await handleRetryFailed(chatId)
      break
    case '/postall':
      await handlePostAll(chatId)
      break
    case '/webhook':
      await handleWebhookSetup(chatId)
      break
    default:
      // If it starts with /, it's an unknown command
      if (text.startsWith('/')) {
        await sendMessage(
          chatId,
          '\u2753 أمر غير معروف. استخدم /help لعرض الأوامر المتاحة.'
        )
      }
      // Non-command messages are ignored (or could be used for conversation mode)
      break
  }
}

// ─── Command Handlers ────────────────────────────────────────

async function handleStart(chatId: number) {
  const msg = `\u{1F680} <b>مرحباً بك في Postlate Bot!</b>

\u{1F4CB} بوت جدولة ونشر التغريدات التلقائي

<b>الأوامر الرئيسية:</b>
\u2022 /list - عرض كل التغريدات
\u2022 /pending - التغريدات المعلقة
\u2022 /schedule - جدولة تغريدة جديدة
\u2022 /quick <نص> - جدولة سريعة
\u2022 /status - حالة النظام

استخدم /help لعرض كل الأوامر \u{1F447}`

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '\u{1F4CB} التغريدات المعلقة', callback_data: 'list_pending' },
        { text: '\u{1F4CA} حالة النظام', callback_data: 'status' },
      ],
      [
        { text: '\u2795 جدولة تغريدة', callback_data: 'schedule_new' },
      ],
    ],
  }

  await sendMessage(chatId, msg, { reply_markup: keyboard })
}

async function handleHelp(chatId: number) {
  const msg = `\u{1F4D6} <b>كل أوامر Postlate Bot:</b>

<b>\u{1F4CB} عرض التغريدات:</b>
/list - كل التغريدات
/pending - المعلقة فقط
/posted - المنشورة
/failed - الفاشلة

<b>\u270F\uFE0F إدارة التغريدات:</b>
/schedule - جدولة تغريدة (خطوة بخطوة)
/quick &lt;نص&gt; - جدولة سريعة لأقرب موعد
/edit &lt;رقم&gt; &lt;نص جديد&gt; - تعديل تغريدة
/delete &lt;رقم&gt; - حذف تغريدة

<b>\u{1F4E4} النشر:</b>
/post &lt;رقم&gt; - نشر تغريدة فوراً
/postall - نشر كل المعلقة
/retry - إعادة محاولة الفاشلة

<b>\u{1F6E0} أدوات:</b>
/translate &lt;نص&gt; - ترجمة بالذكاء الاصطناعي
/status - حالة النظام

<b>ملاحظة:</b> &lt;رقم&gt; = ترتيب التغريدة بالقائمة (1, 2, 3...)`

  await sendMessage(chatId, msg)
}

async function handleList(chatId: number, filter: 'all' | 'pending' | 'posted' | 'failed') {
  try {
    const allTweets = await readTweets()
    let tweets: ScheduledTweet[]
    let title: string

    switch (filter) {
      case 'pending':
        tweets = allTweets.filter(t => t.status === 'pending')
        title = '\u23F3 التغريدات المعلقة'
        break
      case 'posted':
        tweets = allTweets.filter(t => t.status === 'posted')
        title = '\u2705 التغريدات المنشورة'
        break
      case 'failed':
        tweets = allTweets.filter(t => t.status === 'failed')
        title = '\u274C التغريدات الفاشلة'
        break
      default:
        tweets = allTweets
        title = '\u{1F4CB} كل التغريدات'
    }

    if (tweets.length === 0) {
      await sendMessage(chatId, `${title}\n\n\u{1F4ED} لا توجد تغريدات.`)
      return
    }

    // Sort by scheduledAt
    tweets.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

    // Paginate (max 10 per message)
    const pageSize = 10
    const page = tweets.slice(0, pageSize)

    let msg = `<b>${title}</b> (${tweets.length} تغريدة)\n\n`

    page.forEach((tweet, i) => {
      const num = i + 1
      const status = formatStatus(tweet.status)
      const text = escapeHtml(truncateText(tweet.translatedText, 80))
      const date = formatDate(tweet.scheduledAt)
      const threadBadge = tweet.isThread ? ' \u{1F9F5}' : ''

      msg += `<b>${num}.</b> ${status}${threadBadge}\n`
      msg += `   ${text}\n`
      msg += `   \u{1F4C5} ${date}\n`
      if (tweet.errorMessage) {
        msg += `   \u26A0\uFE0F ${escapeHtml(truncateText(tweet.errorMessage, 60))}\n`
      }
      msg += '\n'
    })

    if (tweets.length > pageSize) {
      msg += `\n<i>... و ${tweets.length - pageSize} تغريدة أخرى</i>`
    }

    // Add action buttons
    const buttons: InlineKeyboardButton[][] = []

    if (filter === 'all' || filter === 'pending') {
      const pendingCount = (filter === 'pending' ? tweets : allTweets.filter(t => t.status === 'pending')).length
      if (pendingCount > 0) {
        buttons.push([
          { text: `\u{1F4E4} نشر الكل (${pendingCount})`, callback_data: 'post_all' },
        ])
      }
    }

    if (filter === 'all' || filter === 'failed') {
      const failedCount = (filter === 'failed' ? tweets : allTweets.filter(t => t.status === 'failed')).length
      if (failedCount > 0) {
        buttons.push([
          { text: `\u{1F504} إعادة محاولة الفاشلة (${failedCount})`, callback_data: 'retry_failed' },
        ])
      }
    }

    buttons.push([
      { text: '\u23F3 معلقة', callback_data: 'list_pending' },
      { text: '\u2705 منشورة', callback_data: 'list_posted' },
      { text: '\u274C فاشلة', callback_data: 'list_failed' },
    ])

    await sendMessage(chatId, msg, {
      reply_markup: { inline_keyboard: buttons },
    })
  } catch (err) {
    console.error('[Bot] handleList error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ في جلب التغريدات. حاول مرة أخرى.')
  }
}

async function handleScheduleStart(chatId: number) {
  const now = new Date()
  const baghdadOffset = 3 * 60 * 60 * 1000
  const baghdadNow = new Date(now.getTime() + baghdadOffset)

  // Generate next 6 time slots
  const slots = ['09:00', '12:00', '16:00', '20:00']
  const buttons: InlineKeyboardButton[][] = []

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const day = new Date(baghdadNow)
    day.setDate(day.getDate() + dayOffset)
    const dayLabel = dayOffset === 0 ? 'اليوم' : dayOffset === 1 ? 'غداً' : 'بعد غد'

    const row: InlineKeyboardButton[] = []
    for (const slot of slots) {
      const [h, m] = slot.split(':').map(Number)
      const slotTime = new Date(day)
      slotTime.setHours(h, m, 0, 0)

      // Skip past slots
      if (slotTime.getTime() <= baghdadNow.getTime()) continue

      const isoTime = new Date(slotTime.getTime() - baghdadOffset).toISOString()
      const slotLabel = slot === '09:00' ? '\u{1F305}' : slot === '12:00' ? '\u2600\uFE0F' : slot === '16:00' ? '\u{1F305}' : '\u{1F319}'
      row.push({
        text: `${slotLabel} ${dayLabel} ${slot}`,
        callback_data: `sched_time_${isoTime}`,
      })
    }
    if (row.length > 0) {
      // Split into rows of 2
      for (let i = 0; i < row.length; i += 2) {
        buttons.push(row.slice(i, i + 2))
      }
    }
  }

  buttons.push([{ text: '\u274C إلغاء', callback_data: 'cancel' }])

  const msg = `\u2795 <b>جدولة تغريدة جديدة</b>\n\n\u{1F4C5} اختر موعد النشر:\n\n<i>بعد اختيار الموعد، أرسل نص التغريدة</i>`

  await sendMessage(chatId, msg, {
    reply_markup: { inline_keyboard: buttons },
  })
}

async function handleQuickSchedule(chatId: number, text: string) {
  if (!text || text.trim().length === 0) {
    await sendMessage(
      chatId,
      '\u{1F4DD} <b>جدولة سريعة</b>\n\nالاستخدام: /quick &lt;نص التغريدة&gt;\n\n<i>مثال:</i> /quick صباح الخير يا تويتر!\n\n(سيتم جدولتها لأقرب موعد متاح)'
    )
    return
  }

  if (text.length > 280) {
    await sendMessage(chatId, `\u26A0\uFE0F النص طويل جداً (${text.length}/280 حرف). قصّر النص وحاول مرة أخرى.`)
    return
  }

  try {
    // Find next available slot
    const now = new Date()
    const baghdadOffset = 3 * 60 * 60 * 1000
    const baghdadNow = new Date(now.getTime() + baghdadOffset)
    const slots = [9, 12, 16, 20]

    let scheduledAt: Date | null = null

    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      for (const hour of slots) {
        const candidate = new Date(baghdadNow)
        candidate.setDate(candidate.getDate() + dayOffset)
        candidate.setHours(hour, 0, 0, 0)

        if (candidate.getTime() > baghdadNow.getTime()) {
          scheduledAt = new Date(candidate.getTime() - baghdadOffset)
          break
        }
      }
      if (scheduledAt) break
    }

    if (!scheduledAt) {
      await sendMessage(chatId, '\u274C لا توجد مواعيد متاحة. حاول مرة أخرى لاحقاً.')
      return
    }

    // Schedule via internal API
    const newTweet: ScheduledTweet = {
      id: generateId(),
      originalText: '',
      translatedText: text.trim(),
      scheduledAt: scheduledAt.toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    const tweets = await readTweets()
    tweets.push(newTweet)
    await writeTweets(tweets)

    const msg = `\u2705 <b>تم جدولة التغريدة!</b>\n\n\u{1F4DD} ${escapeHtml(truncateText(text, 200))}\n\n\u{1F4C5} ${formatDate(scheduledAt.toISOString())}\n\n<i>ستُنشر تلقائياً في الموعد المحدد</i>`

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '\u{1F4E4} نشر الآن', callback_data: `post_${newTweet.id}` },
          { text: '\u{1F5D1} حذف', callback_data: `del_${newTweet.id}` },
        ],
        [{ text: '\u{1F4CB} عرض الكل', callback_data: 'list_pending' }],
      ],
    }

    await sendMessage(chatId, msg, { reply_markup: keyboard })
  } catch (err) {
    console.error('[Bot] handleQuickSchedule error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ في الجدولة. حاول مرة أخرى.')
  }
}

async function handlePostTweet(chatId: number, indexStr: string) {
  if (!indexStr) {
    await sendMessage(chatId, '\u{1F4E4} الاستخدام: /post &lt;رقم&gt;\n\n<i>مثال:</i> /post 1\n\nاستخدم /pending لعرض الأرقام.')
    return
  }

  const index = parseInt(indexStr) - 1
  if (isNaN(index) || index < 0) {
    await sendMessage(chatId, '\u26A0\uFE0F رقم غير صالح. استخدم /pending لعرض التغريدات وأرقامها.')
    return
  }

  try {
    const tweets = await readTweets()
    const pending = tweets.filter(t => t.status === 'pending')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

    if (index >= pending.length) {
      await sendMessage(chatId, `\u26A0\uFE0F لا توجد تغريدة بالرقم ${index + 1}. عدد المعلقة: ${pending.length}`)
      return
    }

    const tweet = pending[index]

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '\u2705 نعم، انشر الآن', callback_data: `confirm_post_${tweet.id}` },
          { text: '\u274C إلغاء', callback_data: 'cancel' },
        ],
      ],
    }

    const msg = `\u{1F4E4} <b>تأكيد النشر الفوري:</b>\n\n${escapeHtml(truncateText(tweet.translatedText, 250))}\n\n\u{1F4C5} كانت مجدولة: ${formatDate(tweet.scheduledAt)}`

    await sendMessage(chatId, msg, { reply_markup: keyboard })
  } catch (err) {
    console.error('[Bot] handlePostTweet error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ. حاول مرة أخرى.')
  }
}

async function handleDeleteTweet(chatId: number, indexStr: string) {
  if (!indexStr) {
    await sendMessage(chatId, '\u{1F5D1} الاستخدام: /delete &lt;رقم&gt;\n\n<i>مثال:</i> /delete 1\n\nاستخدم /list لعرض الأرقام.')
    return
  }

  const index = parseInt(indexStr) - 1
  if (isNaN(index) || index < 0) {
    await sendMessage(chatId, '\u26A0\uFE0F رقم غير صالح.')
    return
  }

  try {
    const tweets = await readTweets()
    const sorted = [...tweets].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

    if (index >= sorted.length) {
      await sendMessage(chatId, `\u26A0\uFE0F لا توجد تغريدة بالرقم ${index + 1}.`)
      return
    }

    const tweet = sorted[index]

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '\u2705 نعم، احذف', callback_data: `confirm_del_${tweet.id}` },
          { text: '\u274C إلغاء', callback_data: 'cancel' },
        ],
      ],
    }

    const msg = `\u{1F5D1} <b>تأكيد الحذف:</b>\n\n${formatStatus(tweet.status)}\n${escapeHtml(truncateText(tweet.translatedText, 200))}\n\n<b>هل تريد حذف هذه التغريدة؟</b>`

    await sendMessage(chatId, msg, { reply_markup: keyboard })
  } catch (err) {
    console.error('[Bot] handleDeleteTweet error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ. حاول مرة أخرى.')
  }
}

async function handleEditTweet(chatId: number, indexStr: string, newText: string) {
  if (!indexStr) {
    await sendMessage(
      chatId,
      '\u270F\uFE0F الاستخدام: /edit &lt;رقم&gt; &lt;النص الجديد&gt;\n\n<i>مثال:</i> /edit 1 صباح الخير يا عالم!\n\nاستخدم /pending لعرض الأرقام.'
    )
    return
  }

  const index = parseInt(indexStr) - 1
  if (isNaN(index) || index < 0) {
    await sendMessage(chatId, '\u26A0\uFE0F رقم غير صالح.')
    return
  }

  if (!newText || newText.trim().length === 0) {
    await sendMessage(chatId, '\u26A0\uFE0F أرسل النص الجديد بعد الرقم.\n\n<i>مثال:</i> /edit 1 النص الجديد هنا')
    return
  }

  if (newText.length > 280) {
    await sendMessage(chatId, `\u26A0\uFE0F النص طويل (${newText.length}/280 حرف).`)
    return
  }

  try {
    const tweets = await readTweets()
    const pending = tweets.filter(t => t.status === 'pending' || t.status === 'failed')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

    if (index >= pending.length) {
      await sendMessage(chatId, `\u26A0\uFE0F لا توجد تغريدة بالرقم ${index + 1}.`)
      return
    }

    const tweet = pending[index]
    const tweetIdx = tweets.findIndex(t => t.id === tweet.id)

    if (tweetIdx === -1) {
      await sendMessage(chatId, '\u274C تغريدة غير موجودة.')
      return
    }

    if (tweets[tweetIdx].status === 'posted') {
      await sendMessage(chatId, '\u26A0\uFE0F لا يمكن تعديل تغريدة منشورة.')
      return
    }

    const oldText = tweets[tweetIdx].translatedText
    tweets[tweetIdx].translatedText = newText.trim()

    // Reset failed to pending
    if (tweets[tweetIdx].status === 'failed') {
      tweets[tweetIdx].status = 'pending'
      tweets[tweetIdx].errorMessage = undefined
    }

    await writeTweets(tweets)

    const msg = `\u2705 <b>تم تعديل التغريدة!</b>\n\n<b>القديم:</b>\n<s>${escapeHtml(truncateText(oldText, 150))}</s>\n\n<b>الجديد:</b>\n${escapeHtml(truncateText(newText, 150))}\n\n\u{1F4C5} ${formatDate(tweets[tweetIdx].scheduledAt)}`

    await sendMessage(chatId, msg)
  } catch (err) {
    console.error('[Bot] handleEditTweet error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ في التعديل.')
  }
}

async function handleTranslate(chatId: number, text: string) {
  if (!text || text.trim().length === 0) {
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '\u{1F1F8}\u{1F1E6} سعودي', callback_data: 'lang_saudi' },
          { text: '\u{1F1EA}\u{1F1EC} مصري', callback_data: 'lang_egyptian' },
        ],
        [
          { text: '\u{1F4D6} فصحى', callback_data: 'lang_standard' },
          { text: '\u{1F1EC}\u{1F1E7} English', callback_data: 'lang_english' },
        ],
      ],
    }
    await sendMessage(
      chatId,
      '\u{1F310} <b>الترجمة بالذكاء الاصطناعي</b>\n\nالاستخدام: /translate &lt;النص&gt;\n\n<i>مثال:</i> /translate Good morning Twitter!\n\n(الترجمة الافتراضية: سعودي)',
      { reply_markup: keyboard }
    )
    return
  }

  await sendMessage(chatId, '\u23F3 جاري الترجمة...')

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`
    const res = await fetch(`${baseUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), language: 'saudi' }),
    })

    const data = await res.json()

    if (!res.ok || !data.translated) {
      await sendMessage(chatId, `\u274C فشلت الترجمة: ${data.error || 'خطأ غير معروف'}`)
      return
    }

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '\u{1F4E4} جدولة الترجمة', callback_data: `sched_translated_${Buffer.from(data.translated).toString('base64').substring(0, 60)}` },
        ],
      ],
    }

    const msg = `\u{1F310} <b>الترجمة:</b>\n\n<b>الأصلي:</b>\n${escapeHtml(text)}\n\n<b>المترجم:</b>\n${escapeHtml(data.translated)}`

    await sendMessage(chatId, msg, { reply_markup: keyboard })
  } catch (err) {
    console.error('[Bot] handleTranslate error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ في الترجمة. تأكد من إعداد OPENAI_API_KEY.')
  }
}

async function handleStatus(chatId: number) {
  try {
    const tweets = await readTweets()
    const pending = tweets.filter(t => t.status === 'pending')
    const posted = tweets.filter(t => t.status === 'posted')
    const failed = tweets.filter(t => t.status === 'failed')

    // Next scheduled tweet
    const nextTweet = pending
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]

    let msg = `\u{1F4CA} <b>حالة النظام - Postlate</b>\n\n`
    msg += `\u{1F4DD} إجمالي التغريدات: <b>${tweets.length}</b>\n`
    msg += `\u23F3 معلقة: <b>${pending.length}</b>\n`
    msg += `\u2705 منشورة: <b>${posted.length}</b>\n`
    msg += `\u274C فاشلة: <b>${failed.length}</b>\n`

    if (nextTweet) {
      msg += `\n\u{1F4C5} <b>القادمة:</b>\n`
      msg += `${escapeHtml(truncateText(nextTweet.translatedText, 100))}\n`
      msg += `\u{1F552} ${formatDate(nextTweet.scheduledAt)}\n`
    }

    // System checks
    msg += `\n\u{1F6E0} <b>حالة الخدمات:</b>\n`
    msg += `\u2022 Twitter API: ${process.env.TWITTER_API_KEY ? '\u2705' : '\u274C غير مضبوط'}\n`
    msg += `\u2022 OpenAI: ${process.env.OPENAI_API_KEY ? '\u2705' : '\u274C غير مضبوط'}\n`
    msg += `\u2022 Redis: ${process.env.UPSTASH_REDIS_REST_URL ? '\u2705' : '\u274C غير مضبوط'}\n`
    msg += `\u2022 Telegram Bot: \u2705\n`

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '\u{1F504} تحديث', callback_data: 'status' },
          { text: '\u{1F4CB} التغريدات', callback_data: 'list_all' },
        ],
      ],
    }

    await sendMessage(chatId, msg, { reply_markup: keyboard })
  } catch (err) {
    console.error('[Bot] handleStatus error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ في جلب الحالة.')
  }
}

async function handleRetryFailed(chatId: number) {
  try {
    const tweets = await readTweets()
    const failed = tweets.filter(t => t.status === 'failed')

    if (failed.length === 0) {
      await sendMessage(chatId, '\u2705 لا توجد تغريدات فاشلة!')
      return
    }

    // Reset all failed to pending
    let resetCount = 0
    for (const tweet of failed) {
      const idx = tweets.findIndex(t => t.id === tweet.id)
      if (idx !== -1) {
        tweets[idx].status = 'pending'
        tweets[idx].errorMessage = undefined
        resetCount++
      }
    }

    await writeTweets(tweets)

    await sendMessage(
      chatId,
      `\u{1F504} <b>تم إعادة ${resetCount} تغريدة للانتظار!</b>\n\n<i>ستُنشر تلقائياً عند الموعد التالي، أو استخدم /postall للنشر فوراً.</i>`
    )
  } catch (err) {
    console.error('[Bot] handleRetryFailed error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ. حاول مرة أخرى.')
  }
}

async function handlePostAll(chatId: number) {
  try {
    const tweets = await readTweets()
    const pending = tweets.filter(t => t.status === 'pending')

    if (pending.length === 0) {
      await sendMessage(chatId, '\u{1F4ED} لا توجد تغريدات معلقة للنشر.')
      return
    }

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: `\u2705 نعم، انشر الكل (${pending.length})`, callback_data: 'confirm_post_all' },
          { text: '\u274C إلغاء', callback_data: 'cancel' },
        ],
      ],
    }

    await sendMessage(
      chatId,
      `\u{1F4E4} <b>نشر كل التغريدات المعلقة؟</b>\n\n\u{1F4DD} عدد التغريدات: <b>${pending.length}</b>\n\n<i>سيتم نشرها واحدة تلو الأخرى عبر Twitter API.</i>`,
      { reply_markup: keyboard }
    )
  } catch (err) {
    console.error('[Bot] handlePostAll error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ.')
  }
}

async function handleWebhookSetup(chatId: number) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
  if (!baseUrl) {
    await sendMessage(chatId, '\u274C NEXT_PUBLIC_BASE_URL غير مضبوط.')
    return
  }

  const webhookUrl = `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/telegram`
  await sendMessage(chatId, `\u23F3 جاري إعداد الـ Webhook...\n\nURL: ${webhookUrl}`)

  const result = await setWebhook(webhookUrl)

  if (result) {
    await sendMessage(chatId, '\u2705 <b>تم إعداد الـ Webhook بنجاح!</b>\n\nالبوت جاهز لاستقبال الأوامر.')
  } else {
    await sendMessage(chatId, '\u274C فشل إعداد الـ Webhook. تحقق من TELEGRAM_BOT_TOKEN.')
  }
}

// ─── Callback Query Handler ──────────────────────────────────

async function handleCallbackQuery(query: TelegramUpdate['callback_query'] & {}) {
  const chatId = query.message?.chat.id
  const messageId = query.message?.message_id
  const data = query.data || ''

  if (!chatId) return

  // Authorization
  if (!isAuthorized(chatId)) {
    await answerCallbackQuery(query.id, '\u26D4 غير مصرح', true)
    return
  }

  // Acknowledge the callback immediately
  await answerCallbackQuery(query.id)

  // Route callback data
  if (data === 'list_pending') {
    await handleList(chatId, 'pending')
  } else if (data === 'list_posted') {
    await handleList(chatId, 'posted')
  } else if (data === 'list_failed') {
    await handleList(chatId, 'failed')
  } else if (data === 'list_all') {
    await handleList(chatId, 'all')
  } else if (data === 'status') {
    await handleStatus(chatId)
  } else if (data === 'schedule_new') {
    await handleScheduleStart(chatId)
  } else if (data === 'post_all') {
    await handlePostAll(chatId)
  } else if (data === 'retry_failed') {
    await handleRetryFailed(chatId)
  } else if (data === 'cancel') {
    if (messageId) {
      await editMessageText(chatId, messageId, '\u274C تم الإلغاء.')
    }
  } else if (data.startsWith('post_')) {
    // Direct post by ID
    const tweetId = data.replace('post_', '')
    await executePost(chatId, tweetId)
  } else if (data.startsWith('confirm_post_')) {
    const tweetId = data.replace('confirm_post_', '')
    await executePost(chatId, tweetId)
  } else if (data.startsWith('del_')) {
    const tweetId = data.replace('del_', '')
    await executeDelete(chatId, tweetId)
  } else if (data.startsWith('confirm_del_')) {
    const tweetId = data.replace('confirm_del_', '')
    await executeDelete(chatId, tweetId)
  } else if (data === 'confirm_post_all') {
    await executePostAll(chatId)
  } else if (data.startsWith('sched_time_')) {
    const isoTime = data.replace('sched_time_', '')
    // Store the selected time and ask for tweet text
    // We use a simple approach: send a message asking for text
    if (messageId) {
      await editMessageText(
        chatId,
        messageId,
        `\u2705 <b>الموعد:</b> ${formatDate(isoTime)}\n\n\u{1F4DD} الآن أرسل نص التغريدة باستخدام:\n/quick &lt;النص&gt;\n\n<i>أو استخدم:</i>\n<code>/quick نص التغريدة هنا</code>`
      )
    }
  }
}

// ─── Execution Helpers ───────────────────────────────────────

async function executePost(chatId: number, tweetId: string) {
  try {
    await sendMessage(chatId, '\u23F3 جاري النشر على تويتر...')

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`
    const res = await fetch(`${baseUrl}/api/post-tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tweetId }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      const tweets = await readTweets()
      const tweet = tweets.find(t => t.id === tweetId)
      const text = tweet ? truncateText(tweet.translatedText, 200) : 'التغريدة'

      await sendMessage(
        chatId,
        `\u2705 <b>تم النشر بنجاح!</b>\n\n${escapeHtml(text)}`
      )
    } else {
      await sendMessage(
        chatId,
        `\u274C <b>فشل النشر:</b> ${escapeHtml(data.error || 'خطأ غير معروف')}`
      )
    }
  } catch (err) {
    console.error('[Bot] executePost error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ أثناء النشر. حاول مرة أخرى.')
  }
}

async function executeDelete(chatId: number, tweetId: string) {
  try {
    const tweets = await readTweets()
    const idx = tweets.findIndex(t => t.id === tweetId)

    if (idx === -1) {
      await sendMessage(chatId, '\u26A0\uFE0F التغريدة غير موجودة أو تم حذفها مسبقاً.')
      return
    }

    const deletedText = truncateText(tweets[idx].translatedText, 100)
    tweets.splice(idx, 1)
    await writeTweets(tweets)

    await sendMessage(
      chatId,
      `\u{1F5D1} <b>تم حذف التغريدة!</b>\n\n<s>${escapeHtml(deletedText)}</s>`
    )
  } catch (err) {
    console.error('[Bot] executeDelete error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ في الحذف.')
  }
}

async function executePostAll(chatId: number) {
  try {
    await sendMessage(chatId, '\u23F3 جاري نشر كل التغريدات المعلقة...')

    const tweets = await readTweets()
    const pendingIds = tweets
      .filter(t => t.status === 'pending')
      .map(t => t.id)

    if (pendingIds.length === 0) {
      await sendMessage(chatId, '\u{1F4ED} لا توجد تغريدات معلقة.')
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`
    const res = await fetch(`${baseUrl}/api/post-tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bulk: true, ids: pendingIds }),
    })

    const data = await res.json()

    if (res.ok) {
      let msg = `\u{1F4E4} <b>نتيجة النشر الجماعي:</b>\n\n`
      msg += `\u2705 تم النشر: <b>${data.posted || 0}</b>\n`
      msg += `\u274C فشلت: <b>${data.failed || 0}</b>\n`

      await sendMessage(chatId, msg)
    } else {
      await sendMessage(chatId, `\u274C فشل النشر الجماعي: ${escapeHtml(data.error || 'خطأ')}`)
    }
  } catch (err) {
    console.error('[Bot] executePostAll error:', err)
    await sendMessage(chatId, '\u274C حدث خطأ. حاول مرة أخرى.')
  }
}

// ─── Utility ─────────────────────────────────────────────────

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
