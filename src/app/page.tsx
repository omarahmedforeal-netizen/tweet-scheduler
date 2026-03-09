'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
// i18n will be loaded at runtime to prevent minifier from escaping Arabic text
type I18nStrings = Record<string, string>;

// ==================== TYPES ====================
interface ScheduledTweet {
  id: string
  originalText: string
  translatedText: string
  scheduledAt: string
  status: 'pending' | 'posted' | 'failed'
  createdAt: string
  tweetUrl?: string
  postedAt?: string
  errorMessage?: string
  threadId?: string
  threadIndex?: number
  isThread?: boolean
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ThreadItem {
  text: string
  originalText: string
}

// ==================== CONSTANTS ====================
// LANGUAGES defined inside Home() (uses i18n from JSON.parse)

const CHAR_LIMIT = 280
type FilterTab = 'all' | 'pending' | 'posted' | 'failed'

let toastCounter = 0

// ==================== SVG ICONS ====================
const Spinner = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg className={`animate-spin ${size}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 008.002-4.998z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const MinusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
)

// ==================== MAIN COMPONENT ====================
export default function Home() {
  // --- i18n: JSON.parse at runtime prevents minifier from escaping Arabic ---
  const i18n: I18nStrings = JSON.parse('{"langSaudi":"السعودية","langEgyptian":"المصرية","langStandard":"الفصحى","fetchFailed":"فشل جلب التغريدة","fetchSuccess":"تم جلب التغريدة بنجاح","unexpectedError":"حدث خطأ غير متوقع","translateFailed":"فشل الترجمة","translateSuccess":"تمت الترجمة بنجاح","translateError":"حدث خطأ في الترجمة","threadTranslateSuccess":"تمت ترجمة الثريد بنجاح","specifyPublishTime":"يرجى تحديد وقت النشر","threadNeedsTwoTweets":"الثريد يحتاج تغريدتين على الأقل","scheduleFailed":"فشل الجدولة","scheduleError":"حدث خطأ في الجدولة","noTextToSchedule":"لا يوجد نص للجدولة","scheduleSuccess":"تم جدولة التغريدة بنجاح!","publishFailed":"فشل النشر","publishSuccess":"تم نشر التغريدة بنجاح!","deleteFailed":"فشل الحذف","deleteSuccess":"تم حذف التغريدة","editFailed":"فشل التعديل","editSuccess":"تم تعديل التغريدة بنجاح","confirmPublish":"تأكيد النشر","confirmPublishMessage":"هل أنت متأكد أنك تريد نشر هذه التغريدة الآن؟","confirmDelete":"تأكيد الحذف","confirmDeleteMessage":"هل أنت متأكد أنك تريد حذف هذه التغريدة؟","yesPublish":"نعم، انشر","yesDelete":"نعم، احذف","cancel":"إلغاء","editTweet":"تعديل التغريدة","textLabel":"النص","publishTimeLabel":"وقت النشر","saveChanges":"حفظ التعديلات","saving":"جاري الحفظ...","pageTitle":"مجدول التغريدات","pageSubtitle":"جلب · ترجمة · جدولة","lightMode":"الوضع الفاتح","darkMode":"الوضع الداكن","all":"الكل","pending":"قيد الانتظار","published":"نُشرت","failed":"فشلت","fetchFromUrl":"جلب من رابط","directWrite":"كتابة مباشرة","thread":"ثريد","tweetUrl":"رابط التغريدة","fetch":"جلب","originalText":"النص الأصلي","writeYourTweet":"اكتب تغريدتك","writeTweetPlaceholder":"اكتب نص التغريدة هنا...","addTweet":"إضافة تغريدة","tweetNumber":"التغريدة","translationLanguage":"لغة الترجمة","translate":"ترجمة","translating":"جاري الترجمة...","translatedText":"النص المترجم","charLimitExceeded":"تجاوز الحد الأقصى","charUnit":"حرف","publishTime":"وقت النشر","scheduling":"جاري الجدولة...","schedulePublish":"جدولة النشر","scheduleThread":"جدولة الثريد","tweetsUnit":"تغريدات","scheduledTweets":"التغريدات المجدولة","tweetUnit":"تغريدة","searchPlaceholder":"بحث في التغريدات...","noSearchResults":"لا توجد نتائج للبحث","noTweets":"لا توجد تغريدات مجدولة بعد","statusPublished":"نُشر","statusFailed":"فشل","statusPending":"قيد الانتظار","edit":"تعديل","publishNow":"نشر الآن","delete":"حذف","source":"المصدر","builtWith":"مبني بـ Next.js 14","selected":"محدد","publishSelected":"نشر المحدد","deleteSelected":"حذف المحدد","scheduledThreadOf":"تم جدولة ثريد من","publishedThreadOf":"تم نشر ثريد","deletedCount":"تم حذف","publishedCount":"تم نشر"}');

  const LANGUAGES = [
    { value: 'saudi', label: i18n.langSaudi },
    { value: 'egyptian', label: i18n.langEgyptian },
    { value: 'standard', label: i18n.langStandard },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'Français' },
  ];

  // --- Theme ---
  const [isDark, setIsDark] = useState(true)

  // --- Input mode ---
  const [inputMode, setInputMode] = useState<'fetch' | 'write'>('fetch')

  // --- Fetch mode state ---
  const [tweetUrl, setTweetUrl] = useState('')
  const [fetchedText, setFetchedText] = useState('')

  // --- Write mode state ---
  const [directText, setDirectText] = useState('')

  // --- Thread state ---
  const [isThreadMode, setIsThreadMode] = useState(false)
  const [threadItems, setThreadItems] = useState<ThreadItem[]>([{ text: '', originalText: '' }])

  // --- Common state ---
  const [translatedText, setTranslatedText] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduledTweets, setScheduledTweets] = useState<ScheduledTweet[]>([])
  const [language, setLanguage] = useState('saudi')

  // --- Loading states ---
  const [loadingFetch, setLoadingFetch] = useState(false)
  const [loadingTranslate, setLoadingTranslate] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [loadingPost, setLoadingPost] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)

  // --- Error states ---
  const [fetchError, setFetchError] = useState('')
  const [translateError, setTranslateError] = useState('')
  const [scheduleError, setScheduleError] = useState('')

  // --- UI states ---
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmPostId, setConfirmPostId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingTweet, setEditingTweet] = useState<ScheduledTweet | null>(null)
  const [editText, setEditText] = useState('')
  const [editTime, setEditTime] = useState('')

  // --- Filter & Search ---
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // --- Bulk selection ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingBulk, setLoadingBulk] = useState(false)

  // ==================== THEME ====================
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light') {
      setIsDark(false)
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      if (next) {
        document.documentElement.classList.remove('light')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.add('light')
        localStorage.setItem('theme', 'light')
      }
      return next
    })
  }, [])

  // ==================== TOAST ====================
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastCounter
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ==================== DATA LOADING ====================
  const loadScheduledTweets = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule')
      if (res.ok) {
        const data = await res.json()
        setScheduledTweets(data.tweets || [])
      }
    } catch {
      // silent fail on load
    }
  }, [])

  useEffect(() => {
    loadScheduledTweets()
    const interval = setInterval(loadScheduledTweets, 30000)
    return () => clearInterval(interval)
  }, [loadScheduledTweets])

  // Set default scheduled time
  useEffect(() => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    setScheduledAt(local.toISOString().slice(0, 16))
  }, [])

  // ==================== STATS ====================
  const stats = useMemo(() => {
    const total = scheduledTweets.length
    const pending = scheduledTweets.filter(t => t.status === 'pending').length
    const posted = scheduledTweets.filter(t => t.status === 'posted').length
    const failed = scheduledTweets.filter(t => t.status === 'failed').length
    return { total, pending, posted, failed }
  }, [scheduledTweets])

  // ==================== FILTERED TWEETS ====================
  const filteredTweets = useMemo(() => {
    let result = [...scheduledTweets]
    if (filterTab !== 'all') {
      result = result.filter(t => t.status === filterTab)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        t =>
          t.translatedText.toLowerCase().includes(q) ||
          t.originalText.toLowerCase().includes(q)
      )
    }
    return result.reverse()
  }, [scheduledTweets, filterTab, searchQuery])

  // ==================== HANDLERS ====================
  const handleFetchTweet = async () => {
    if (!tweetUrl.trim()) return
    setLoadingFetch(true)
    setFetchError('')
    setFetchedText('')
    setTranslatedText('')
    try {
      const res = await fetch('/api/fetch-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tweetUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || i18n.fetchFailed)
      setFetchedText(data.text)
      addToast(i18n.fetchSuccess, 'success')
      await handleTranslate(data.text)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : i18n.unexpectedError
      setFetchError(msg)
      addToast(msg, 'error')
    } finally {
      setLoadingFetch(false)
    }
  }

  const handleTranslate = async (text?: string) => {
    const textToTranslate = text || (inputMode === 'fetch' ? fetchedText : directText)
    if (!textToTranslate.trim()) return
    setLoadingTranslate(true)
    setTranslateError('')
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToTranslate, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || i18n.translateFailed)
      setTranslatedText(data.translated)
      addToast(i18n.translateSuccess, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : i18n.translateError
      setTranslateError(msg)
      addToast(msg, 'error')
    } finally {
      setLoadingTranslate(false)
    }
  }

  const handleTranslateThread = async () => {
    setLoadingTranslate(true)
    setTranslateError('')
    try {
      const newItems = [...threadItems]
      for (let i = 0; i < newItems.length; i++) {
        if (!newItems[i].originalText.trim() && !newItems[i].text.trim()) continue
        const src = newItems[i].originalText || newItems[i].text
        if (!src.trim()) continue
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: src, language }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || i18n.translateFailed)
        newItems[i] = { ...newItems[i], text: data.translated }
      }
      setThreadItems(newItems)
      addToast(i18n.threadTranslateSuccess, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : i18n.translateError
      setTranslateError(msg)
      addToast(msg, 'error')
    } finally {
      setLoadingTranslate(false)
    }
  }

  const handleSchedule = async () => {
    if (!scheduledAt) {
      setScheduleError(i18n.specifyPublishTime)
      return
    }

    // Thread scheduling
    if (isThreadMode) {
      const validItems = threadItems.filter(item => item.text.trim())
      if (validItems.length < 2) {
        setScheduleError(i18n.threadNeedsTwoTweets)
        return
      }
      setLoadingSchedule(true)
      setScheduleError('')
      try {
        const res = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            thread: validItems.map(item => ({ text: item.text, originalText: item.originalText })),
            scheduledAt: new Date(scheduledAt).toISOString(),
            tweetUrl: tweetUrl.trim() || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || i18n.scheduleFailed)
        addToast(`${i18n.scheduledThreadOf} ${validItems.length} ${i18n.tweetsUnit}`, 'success')
        setThreadItems([{ text: '', originalText: '' }])
        setIsThreadMode(false)
        await loadScheduledTweets()
        resetScheduleTime()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : i18n.scheduleError
        setScheduleError(msg)
        addToast(msg, 'error')
      } finally {
        setLoadingSchedule(false)
      }
      return
    }

    // Single tweet scheduling
    if (!translatedText.trim()) {
      setScheduleError(i18n.noTextToSchedule)
      return
    }
    setLoadingSchedule(true)
    setScheduleError('')
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: inputMode === 'fetch' ? fetchedText : directText,
          text: translatedText,
          scheduledAt: new Date(scheduledAt).toISOString(),
          tweetUrl: inputMode === 'fetch' ? tweetUrl.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || i18n.scheduleFailed)
      addToast(i18n.scheduleSuccess, 'success')
      setTweetUrl('')
      setFetchedText('')
      setDirectText('')
      setTranslatedText('')
      await loadScheduledTweets()
      resetScheduleTime()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : i18n.scheduleError
      setScheduleError(msg)
      addToast(msg, 'error')
    } finally {
      setLoadingSchedule(false)
    }
  }

  const resetScheduleTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    setScheduledAt(local.toISOString().slice(0, 16))
  }

  const handlePostNow = async (id: string) => {
    setConfirmPostId(null)
    setLoadingPost(id)
    try {
      const res = await fetch('/api/post-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || i18n.publishFailed)
      if (data.thread) {
        addToast(`${i18n.publishedThreadOf} (${data.posted}/${data.total})`, 'success')
      } else {
        addToast(i18n.publishSuccess, 'success')
      }
      await loadScheduledTweets()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : i18n.publishFailed
      addToast(msg, 'error')
    } finally {
      setLoadingPost(null)
    }
  }

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null)
    setLoadingDelete(id)
    try {
      const res = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || i18n.deleteFailed)
      addToast(i18n.deleteSuccess, 'info')
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
      await loadScheduledTweets()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : i18n.deleteFailed
      addToast(msg, 'error')
    } finally {
      setLoadingDelete(null)
    }
  }

  // --- Edit handler ---
  const handleOpenEdit = (tweet: ScheduledTweet) => {
    setEditingTweet(tweet)
    setEditText(tweet.translatedText)
    const d = new Date(tweet.scheduledAt)
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    setEditTime(local.toISOString().slice(0, 16))
  }

  const handleSaveEdit = async () => {
    if (!editingTweet) return
    setLoadingEdit(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTweet.id,
          translatedText: editText,
          scheduledAt: new Date(editTime).toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || i18n.editFailed)
      addToast(i18n.editSuccess, 'success')
      setEditingTweet(null)
      await loadScheduledTweets()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : i18n.editFailed
      addToast(msg, 'error')
    } finally {
      setLoadingEdit(false)
    }
  }

  // --- Bulk handlers ---
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setLoadingBulk(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || i18n.deleteFailed)
      addToast(`${i18n.deletedCount} ${data.deleted} ${i18n.tweetUnit}`, 'info')
      setSelectedIds(new Set())
      await loadScheduledTweets()
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : i18n.deleteFailed, 'error')
    } finally {
      setLoadingBulk(false)
    }
  }

  const handleBulkPost = async () => {
    if (selectedIds.size === 0) return
    setLoadingBulk(true)
    try {
      const res = await fetch('/api/post-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, ids: Array.from(selectedIds) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || i18n.publishFailed)
      addToast(`${i18n.publishedCount} ${data.posted} ${i18n.tweetUnit}`, 'success')
      setSelectedIds(new Set())
      await loadScheduledTweets()
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : i18n.publishFailed, 'error')
    } finally {
      setLoadingBulk(false)
    }
  }

  // --- Thread helpers ---
  const addThreadItem = () => {
    setThreadItems(prev => [...prev, { text: '', originalText: '' }])
  }

  const removeThreadItem = (index: number) => {
    if (threadItems.length <= 1) return
    setThreadItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateThreadItem = (index: number, field: 'text' | 'originalText', value: string) => {
    setThreadItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  // --- Utilities ---
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncate = (text: string, max = 120) =>
    text.length > max ? text.slice(0, max) + '...' : text

  const charCount = translatedText.length
  const charOver = charCount > CHAR_LIMIT
  const hasSourceText = inputMode === 'fetch' ? !!fetchedText : !!directText.trim()
  const sourceText = inputMode === 'fetch' ? fetchedText : directText

  // ==================== RENDER ====================
  return (
    <main className="min-h-screen py-6 px-4 sm:py-8">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-blue-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-purple-700 rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-[40%] left-[30%] w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500 rounded-full opacity-5 blur-3xl" />
      </div>

      {/* Toast notifications */}
      <div className="fixed top-4 left-4 right-4 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto max-w-md w-full px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md cursor-pointer animate-toast-in transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-green-500/15 border-green-500/30 text-green-600 dark:text-green-300'
                : toast.type === 'error'
                ? 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-300'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-300'
            }`}
            dir="rtl"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}</span>
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Confirm Post Modal */}
      {confirmPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--modal-overlay)' }}>
          <div className="glass rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-modal-in">
            <h3 className="text-lg font-bold mb-3">{i18n.confirmPublish}</h3>
            <p className="text-sm mb-5" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.confirmPublishMessage}</p>
            <div className="flex gap-3">
              <button onClick={() => handlePostNow(confirmPostId)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm">
                {i18n.yesPublish}
              </button>
              <button onClick={() => setConfirmPostId(null)} className="flex-1 py-2.5 glass glass-hover font-medium rounded-xl transition-all text-sm">
                {i18n.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--modal-overlay)' }}>
          <div className="glass rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-modal-in">
            <h3 className="text-lg font-bold mb-3">{i18n.confirmDelete}</h3>
            <p className="text-sm mb-5" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.confirmDeleteMessage}</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all text-sm">
                {i18n.yesDelete}
              </button>
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 glass glass-hover font-medium rounded-xl transition-all text-sm">
                {i18n.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTweet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--modal-overlay)' }}>
          <div className="glass rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl animate-modal-in">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <EditIcon /> {i18n.editTweet}
            </h3>
            <div className="mb-4">
              <label className="block text-sm mb-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.textLabel}</label>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={4}
                className="w-full input-field rounded-xl px-4 py-3 text-sm leading-relaxed resize-none"
                dir="rtl"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs font-mono ${editText.length > CHAR_LIMIT ? 'text-red-400' : 'text-gray-500'}`}>
                  {editText.length}/{CHAR_LIMIT}
                </span>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm mb-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.publishTimeLabel}</label>
              <input
                type="datetime-local"
                value={editTime}
                onChange={e => setEditTime(e.target.value)}
                className="w-full input-field rounded-xl px-4 py-3 text-sm dark-datetime"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={loadingEdit || editText.length > CHAR_LIMIT || !editText.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                {loadingEdit ? <><Spinner /> {i18n.saving}</> : i18n.saveChanges}
              </button>
              <button onClick={() => setEditingTweet(null)} className="flex-1 py-2.5 glass glass-hover font-medium rounded-xl transition-all text-sm">
                {i18n.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="relative max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
              <span className="text-2xl sm:text-3xl">&#128038;</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{i18n.pageTitle}</h1>
              <p className="text-xs sm:text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.pageSubtitle}</p>
            </div>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl glass glass-hover transition-all"
            title={isDark ? i18n.lightMode : i18n.darkMode}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        {/* Stats Dashboard */}
        {scheduledTweets.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6 animate-slide-up">
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{stats.total}</div>
              <div className="text-xs mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.all}</div>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg sm:text-2xl font-bold text-yellow-500">{stats.pending}</div>
              <div className="text-xs mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.pending}</div>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-500">{stats.posted}</div>
              <div className="text-xs mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.published}</div>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg sm:text-2xl font-bold text-red-500">{stats.failed}</div>
              <div className="text-xs mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.failed}</div>
            </div>
          </div>
        )}

        {/* ==================== MAIN CARD ==================== */}
        <div className="glass rounded-2xl p-5 sm:p-6 mb-6 animate-slide-up">

          {/* Input Mode Toggle */}
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></span>
            <div className="flex bg-black/10 dark:bg-white/5 rounded-xl p-1 gap-1">
              <button
                onClick={() => { setInputMode('fetch'); setIsThreadMode(false) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === 'fetch' && !isThreadMode
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'hover:bg-white/10'
                }`}
              >
                {i18n.fetchFromUrl}
              </button>
              <button
                onClick={() => { setInputMode('write'); setIsThreadMode(false) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === 'write' && !isThreadMode
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'hover:bg-white/10'
                }`}
              >
                {i18n.directWrite}
              </button>
              <button
                onClick={() => { setIsThreadMode(true); setInputMode('write') }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isThreadMode
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'hover:bg-white/10'
                }`}
              >
                {i18n.thread}
              </button>
            </div>
          </div>

          {/* ===== FETCH MODE ===== */}
          {inputMode === 'fetch' && !isThreadMode && (
            <div className="animate-fade-in">
              <div className="mb-4">
                <label className="block text-sm mb-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.tweetUrl}</label>
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="url"
                    value={tweetUrl}
                    onChange={e => setTweetUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFetchTweet()}
                    placeholder="https://twitter.com/user/status/..."
                    dir="ltr"
                    className="flex-1 input-field rounded-xl px-4 py-3 placeholder-gray-500 text-sm"
                  />
                  <button
                    onClick={handleFetchTweet}
                    disabled={loadingFetch || !tweetUrl.trim()}
                    className="px-4 sm:px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap text-sm"
                  >
                    {loadingFetch ? <Spinner /> : i18n.fetch}
                  </button>
                </div>
                {fetchError && <p className="mt-2 text-red-400 text-sm">&#9888; {fetchError}</p>}
              </div>

              {fetchedText && (
                <div className="mb-4 animate-slide-up">
                  <label className="block text-sm mb-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.originalText}</label>
                  <div className="p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                    <p className="text-sm leading-relaxed" dir="auto">{fetchedText}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== WRITE MODE ===== */}
          {inputMode === 'write' && !isThreadMode && (
            <div className="animate-fade-in">
              <div className="mb-4">
                <label className="block text-sm mb-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.writeYourTweet}</label>
                <textarea
                  value={directText}
                  onChange={e => setDirectText(e.target.value)}
                  rows={4}
                  placeholder={i18n.writeTweetPlaceholder}
                  className="w-full input-field rounded-xl px-4 py-3 text-sm leading-relaxed resize-none placeholder-gray-500"
                  dir="rtl"
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs font-mono ${directText.length > CHAR_LIMIT ? 'text-red-400' : 'text-gray-500'}`}>
                    {directText.length}/{CHAR_LIMIT}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ===== THREAD MODE ===== */}
          {isThreadMode && (
            <div className="animate-fade-in">
              <div className="space-y-3 mb-4">
                {threadItems.map((item, index) => (
                  <div key={index} className="relative">
                    {index > 0 && (
                      <div className="absolute right-5 -top-3 w-0.5 h-3 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-30" />
                    )}
                    <div className="p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-400">
                          {index + 1}/{threadItems.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono ${item.text.length > CHAR_LIMIT ? 'text-red-400' : 'text-gray-500'}`}>
                            {item.text.length}/{CHAR_LIMIT}
                          </span>
                          {threadItems.length > 1 && (
                            <button onClick={() => removeThreadItem(index)} className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-all">
                              <MinusIcon />
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        value={item.text}
                        onChange={e => updateThreadItem(index, 'text', e.target.value)}
                        rows={3}
                        placeholder={`${i18n.tweetNumber} ${index + 1}...`}
                        className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none placeholder-gray-500"
                        dir="rtl"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addThreadItem}
                className="w-full py-2.5 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-sm font-medium hover:border-indigo-500/50 hover:bg-indigo-500/5"
                style={{ borderColor: 'var(--glass-border)', color: 'rgb(var(--foreground-secondary))' }}
              >
                <PlusIcon /> {i18n.addTweet}
              </button>
            </div>
          )}

          {/* ===== LANGUAGE SELECTOR ===== */}
          {(hasSourceText || isThreadMode) && (
            <div className="mt-4 mb-4 animate-slide-up">
              <label className="block text-sm mb-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.translationLanguage}</label>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      language === lang.value
                        ? 'bg-purple-600/30 border-purple-500/50 text-purple-400'
                        : 'border-transparent hover:bg-white/10'
                    }`}
                    style={language !== lang.value ? { background: 'var(--card-bg)', borderColor: 'var(--card-border)' } : {}}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              {/* Translate button */}
              <button
                onClick={() => isThreadMode ? handleTranslateThread() : handleTranslate()}
                disabled={loadingTranslate || (isThreadMode ? threadItems.every(i => !i.text.trim()) : !sourceText.trim())}
                className="mt-3 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2"
              >
                {loadingTranslate ? <><Spinner /> {i18n.translating}</> : i18n.translate}
              </button>
              {translateError && <p className="mt-2 text-red-400 text-sm">&#9888; {translateError}</p>}
            </div>
          )}

          {/* ===== TRANSLATED TEXT (single mode) ===== */}
          {!isThreadMode && (loadingTranslate || translatedText) && (
            <div className="mb-4 animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.translatedText}</label>
                {!loadingTranslate && translatedText && (
                  <span className={`text-xs font-mono ${charOver ? 'text-red-400' : charCount > CHAR_LIMIT * 0.9 ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {charCount}/{CHAR_LIMIT}
                  </span>
                )}
              </div>
              <div className={`rounded-xl p-4 ${charOver ? 'border-red-500/40' : ''}`} style={{ background: 'var(--card-bg)', border: `1px solid ${charOver ? 'rgba(239,68,68,0.4)' : 'var(--card-border)'}` }}>
                {loadingTranslate ? (
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                    <Spinner size="w-4 h-4" /> {i18n.translating}
                  </div>
                ) : (
                  <textarea
                    value={translatedText}
                    onChange={e => setTranslatedText(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
                    dir="rtl"
                  />
                )}
              </div>
              {charOver && <p className="mt-1 text-red-400 text-xs">{i18n.charLimitExceeded} ({CHAR_LIMIT} {i18n.charUnit})</p>}
            </div>
          )}

          {/* ===== SCHEDULE TIME ===== */}
          {((translatedText && !loadingTranslate && !isThreadMode) || (isThreadMode && threadItems.some(i => i.text.trim()))) && (
            <div className="mb-5 animate-slide-up">
              <label className="block text-sm mb-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>{i18n.publishTimeLabel}</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full input-field rounded-xl px-4 py-3 text-sm dark-datetime"
              />
            </div>
          )}

          {/* ===== SCHEDULE BUTTON ===== */}
          {((translatedText && !loadingTranslate && !isThreadMode) || (isThreadMode && threadItems.some(i => i.text.trim()))) && (
            <div className="animate-slide-up">
              {scheduleError && <p className="mb-3 text-red-400 text-sm">&#9888; {scheduleError}</p>}
              <button
                onClick={handleSchedule}
                disabled={loadingSchedule || (!isThreadMode && charOver)}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/25 text-base"
              >
                {loadingSchedule ? (
                  <span className="flex items-center justify-center gap-2"><Spinner size="w-5 h-5" /> {i18n.scheduling}</span>
                ) : isThreadMode ? `${i18n.scheduleThread} (${threadItems.filter(i => i.text.trim()).length} ${i18n.tweetsUnit})` : i18n.schedulePublish}
              </button>
            </div>
          )}
        </div>

        {/* ==================== SCHEDULED TWEETS LIST ==================== */}
        <div className="glass rounded-2xl p-5 sm:p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></span>
              {i18n.scheduledTweets}
            </h2>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--card-bg)', color: 'rgb(var(--foreground-secondary))' }}>
              {filteredTweets.length} {i18n.tweetUnit}
            </span>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                <SearchIcon />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={i18n.searchPlaceholder}
                className="w-full input-field rounded-xl pr-10 pl-4 py-2.5 text-sm placeholder-gray-500"
                dir="rtl"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {([['all', i18n.all], ['pending', i18n.pending], ['posted', i18n.published], ['failed', i18n.failed]] as [FilterTab, string][]).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filterTab === tab
                    ? tab === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                    : tab === 'posted' ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                    : tab === 'failed' ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'border'
                }`}
                style={filterTab !== tab ? { background: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'rgb(var(--foreground-secondary))' } : {}}
              >
                {label}
                {tab !== 'all' && (
                  <span className="mr-1 text-[10px] opacity-70">
                    ({tab === 'pending' ? stats.pending : tab === 'posted' ? stats.posted : stats.failed})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tweet Cards */}
          {filteredTweets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">&#128235;</div>
              <p style={{ color: 'rgb(var(--foreground-secondary))' }}>
                {searchQuery ? i18n.noSearchResults : i18n.noTweets}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTweets.map(tweet => (
                <div
                  key={tweet.id}
                  className={`tweet-card rounded-xl p-4 transition-all ${selectedIds.has(tweet.id) ? 'ring-2 ring-indigo-500/50' : ''}`}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tweet.id)}
                      onChange={() => toggleSelect(tweet.id)}
                      className="custom-checkbox mt-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-relaxed flex-1" dir="rtl">
                          {truncate(tweet.translatedText, 150)}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {tweet.isThread && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                              {i18n.thread} {(tweet.threadIndex || 0) + 1}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            tweet.status === 'posted' ? 'status-posted'
                            : tweet.status === 'failed' ? 'status-failed'
                            : 'status-pending'
                          }`}>
                            {tweet.status === 'posted' ? `✓ ${i18n.statusPublished}`
                            : tweet.status === 'failed' ? `✗ ${i18n.statusFailed}`
                            : `⌛ ${i18n.statusPending}`}
                          </span>
                        </div>
                      </div>
                      {tweet.errorMessage && (
                        <p className="text-xs text-red-400 mt-1">&#9888; {tweet.errorMessage}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mr-7">
                    <div className="text-xs flex items-center gap-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                      <span>&#128336;</span>
                      <span dir="ltr">{formatDate(tweet.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tweet.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(tweet)}
                            className="text-xs px-2 py-1.5 rounded-lg transition-all text-indigo-400 hover:bg-indigo-500/20"
                            title={i18n.edit}
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => setConfirmPostId(tweet.id)}
                            disabled={loadingPost === tweet.id}
                            className="text-xs px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 rounded-lg transition-all disabled:opacity-50"
                          >
                            {loadingPost === tweet.id ? <Spinner size="w-3 h-3" /> : i18n.publishNow}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(tweet.id)}
                        disabled={loadingDelete === tweet.id}
                        className="text-xs px-2 py-1.5 bg-red-600/10 hover:bg-red-600/30 border border-red-500/20 text-red-400 rounded-lg transition-all disabled:opacity-50"
                        title={i18n.delete}
                      >
                        {loadingDelete === tweet.id ? <Spinner size="w-3 h-3" /> : <TrashIcon />}
                      </button>
                      {tweet.tweetUrl && (
                        <a
                          href={tweet.tweetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs transition-colors hover:text-indigo-400"
                          style={{ color: 'rgb(var(--foreground-secondary))' }}
                          dir="ltr"
                        >
                          {i18n.source} &#x2197;
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'rgb(var(--foreground-secondary))' }}>
          Tweet Scheduler &middot; {i18n.builtWith}
        </p>
      </div>

      {/* ==================== BULK ACTION BAR ==================== */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-float-up">
          <div className="glass rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl border border-indigo-500/30">
            <span className="text-sm font-medium whitespace-nowrap">
              {selectedIds.size} {i18n.selected}
            </span>
            <div className="w-px h-6 bg-white/10" />
            <button
              onClick={handleBulkPost}
              disabled={loadingBulk}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
            >
              {loadingBulk ? <Spinner size="w-3 h-3" /> : null}
              {i18n.publishSelected}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={loadingBulk}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
            >
              {loadingBulk ? <Spinner size="w-3 h-3" /> : null}
              {i18n.deleteSelected}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 glass glass-hover text-sm rounded-xl transition-all"
            >
              {i18n.cancel}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}