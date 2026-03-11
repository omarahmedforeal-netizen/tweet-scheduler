/**
 * Telegram Bot Helper Library for Postlate Tweet Scheduler
 * Handles sending messages, inline keyboards, and notifications
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

// ─── Types ───────────────────────────────────────────────────

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: CallbackQuery
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  entities?: MessageEntity[]
}

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
}

export interface TelegramChat {
  id: number
  type: string
  title?: string
  first_name?: string
  last_name?: string
  username?: string
}

export interface CallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

export interface MessageEntity {
  type: string
  offset: number
  length: number
}

export interface InlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][]
}

// ─── Core API Methods ────────────────────────────────────────

export async function sendMessage(
  chatId: number | string,
  text: string,
  options?: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    reply_markup?: InlineKeyboardMarkup
    reply_to_message_id?: number
    disable_web_page_preview?: boolean
  }
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode || 'HTML',
        reply_markup: options?.reply_markup,
        reply_to_message_id: options?.reply_to_message_id,
        disable_web_page_preview: options?.disable_web_page_preview ?? true,
      }),
    })
    const data = await res.json()
    if (!data.ok) {
      console.error('[Telegram] sendMessage failed:', data.description)
    }
    return data.ok === true
  } catch (err) {
    console.error('[Telegram] sendMessage error:', err)
    return false
  }
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert?: boolean
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert || false,
      }),
    })
    const data = await res.json()
    return data.ok === true
  } catch (err) {
    console.error('[Telegram] answerCallbackQuery error:', err)
    return false
  }
}

export async function editMessageText(
  chatId: number | string,
  messageId: number,
  text: string,
  options?: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    reply_markup?: InlineKeyboardMarkup
  }
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: options?.parse_mode || 'HTML',
        reply_markup: options?.reply_markup,
      }),
    })
    const data = await res.json()
    return data.ok === true
  } catch (err) {
    console.error('[Telegram] editMessageText error:', err)
    return false
  }
}

export async function deleteMessage(
  chatId: number | string,
  messageId: number
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    })
    const data = await res.json()
    return data.ok === true
  } catch (err) {
    console.error('[Telegram] deleteMessage error:', err)
    return false
  }
}

// ─── Authorization Check ─────────────────────────────────────

export function isAuthorized(chatId: number | string): boolean {
  return String(chatId) === String(OWNER_CHAT_ID)
}

// ─── Notification Helpers ────────────────────────────────────

export async function notifyOwner(text: string, keyboard?: InlineKeyboardMarkup): Promise<boolean> {
  if (!OWNER_CHAT_ID) {
    console.warn('[Telegram] TELEGRAM_CHAT_ID not set, skipping notification')
    return false
  }
  return sendMessage(OWNER_CHAT_ID, text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  })
}

export async function notifyTweetPosted(tweetText: string, count?: number): Promise<boolean> {
  const msg = count && count > 1
    ? `\u2705 <b>تم نشر ${count} تغريدات بنجاح!</b>\n\n<i>آخر تغريدة:</i>\n${escapeHtml(tweetText.substring(0, 200))}${tweetText.length > 200 ? '...' : ''}`
    : `\u2705 <b>تم نشر التغريدة بنجاح!</b>\n\n<i>${escapeHtml(tweetText.substring(0, 300))}${tweetText.length > 300 ? '...' : ''}</i>`
  return notifyOwner(msg)
}

export async function notifyTweetFailed(tweetText: string, error: string): Promise<boolean> {
  const msg = `\u274C <b>فشل نشر التغريدة!</b>\n\n<i>${escapeHtml(tweetText.substring(0, 200))}${tweetText.length > 200 ? '...' : ''}</i>\n\n<b>السبب:</b> ${escapeHtml(error)}`
  return notifyOwner(msg)
}

export async function notifySchedulerRun(result: {
  checked: number
  posted: number
  failed: number
  errors: string[]
}): Promise<boolean> {
  if (result.checked === 0) return true // No need to notify if nothing was due

  let msg = `\U0001F552 <b>تقرير الجدولة التلقائية</b>\n\n`
  msg += `\u2022 تم فحص: <b>${result.checked}</b> تغريدة\n`
  msg += `\u2022 تم النشر: <b>${result.posted}</b>\n`
  msg += `\u2022 فشلت: <b>${result.failed}</b>\n`

  if (result.errors.length > 0) {
    msg += `\n<b>الأخطاء:</b>\n`
    result.errors.slice(0, 3).forEach(e => {
      msg += `\u2022 ${escapeHtml(e.substring(0, 100))}\n`
    })
  }

  return notifyOwner(msg)
}

// ─── Formatting Helpers ──────────────────────────────────────

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Baghdad',
  }
  return date.toLocaleDateString('ar-IQ', options)
}

export function formatStatus(status: string): string {
  switch (status) {
    case 'pending': return '\u23F3 قيد الانتظار'
    case 'posted': return '\u2705 تم النشر'
    case 'failed': return '\u274C فشلت'
    default: return status
  }
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// ─── Webhook Management ──────────────────────────────────────

export async function setWebhook(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      }),
    })
    const data = await res.json()
    console.log('[Telegram] setWebhook result:', data)
    return data.ok === true
  } catch (err) {
    console.error('[Telegram] setWebhook error:', err)
    return false
  }
}

export async function deleteWebhook(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true }),
    })
    const data = await res.json()
    return data.ok === true
  } catch (err) {
    console.error('[Telegram] deleteWebhook error:', err)
    return false
  }
}

export async function getWebhookInfo(): Promise<unknown> {
  try {
    const res = await fetch(`${BASE_URL}/getWebhookInfo`)
    const data = await res.json()
    return data.result
  } catch (err) {
    console.error('[Telegram] getWebhookInfo error:', err)
    return null
  }
}
