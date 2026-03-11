'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  ScheduledTweet, Toast, ThreadItem, TimeSlot, FilterTab, NavSection, I18nStrings,
} from './components/types'
import { CHAR_LIMIT, ARABIC_DAYS, ARABIC_MONTHS, FALLBACK_I18N, buildLanguages } from './components/types'
import { Spinner, PlusIcon, SearchIcon, SlotSunIcon, SlotSunsetIcon, SlotMoonIcon } from './components/Icons'
import { Sidebar, MobileHeader } from './components/Sidebar'
import { CalendarGrid } from './components/CalendarGrid'
import { StatusPills } from './components/StatusPills'
import { TweetCard } from './components/TweetCard'
import { NewTweetModal } from './components/NewTweetModal'
import { EditModal } from './components/EditModal'
import { ToastContainer } from './components/ToastContainer'

let toastCounter = 0

export default function Home() {
  // ==================== i18n ====================
  const [i18n, setI18n] = useState<I18nStrings>(FALLBACK_I18N)
  const [i18nReady, setI18nReady] = useState(false)

  // ==================== Theme ====================
  const [isDark, setIsDark] = useState(false)

  // ==================== Sidebar ====================
  const [activeSection, setActiveSection] = useState<NavSection>('schedule')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ==================== New Tweet Modal ====================
  const [showNewTweetModal, setShowNewTweetModal] = useState(false)
  const [prefilledTime, setPrefilledTime] = useState<string | null>(null)

  // ==================== Input mode ====================
  const [inputMode, setInputMode] = useState<'fetch' | 'write'>('fetch')

  // ==================== Fetch mode state ====================
  const [tweetUrl, setTweetUrl] = useState('')
  const [fetchedText, setFetchedText] = useState('')

  // ==================== Write mode state ====================
  const [directText, setDirectText] = useState('')

  // ==================== Thread state ====================
  const [isThreadMode, setIsThreadMode] = useState(false)
  const [threadItems, setThreadItems] = useState<ThreadItem[]>([{ text: '', originalText: '' }])

  // ==================== Common state ====================
  const [translatedText, setTranslatedText] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduledTweets, setScheduledTweets] = useState<ScheduledTweet[]>([])
  const [language, setLanguage] = useState('saudi')

  // ==================== Loading states ====================
  const [loadingFetch, setLoadingFetch] = useState(false)
  const [loadingTranslate, setLoadingTranslate] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [loadingPost, setLoadingPost] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)

  // ==================== Error states ====================
  const [fetchError, setFetchError] = useState('')
  const [translateError, setTranslateError] = useState('')
  const [scheduleError, setScheduleError] = useState('')

  // ==================== UI states ====================
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmPostId, setConfirmPostId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingTweet, setEditingTweet] = useState<ScheduledTweet | null>(null)
  const [editText, setEditText] = useState('')
  const [editTime, setEditTime] = useState('')

  // ==================== Filter & Search ====================
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // ==================== Bulk selection ====================
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingBulk, setLoadingBulk] = useState(false)

  // ==================== LANGUAGES ====================
  const LANGUAGES = useMemo(() => buildLanguages(i18n), [i18n])

  // ==================== I18N LOADING ====================
  useEffect(() => {
    fetch('/i18n.json')
      .then(res => res.json())
      .then((data: I18nStrings) => {
        setI18n(data)
        setI18nReady(true)
      })
      .catch(() => setI18nReady(true))
  }, [])

  // ==================== THEME ====================
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light') {
      setIsDark(false)
      document.documentElement.classList.add('light')
    } else {
      // Default = dark
      setIsDark(true)
      document.documentElement.classList.remove('light')
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      if (next) {
        // Switch to dark
        document.documentElement.classList.remove('light')
        localStorage.setItem('theme', 'dark')
      } else {
        // Switch to light
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

  // ==================== CALENDAR LOGIC ====================
  const calendarDays = useMemo(() => {
    const days: { date: Date; label: string; dayName: string; dateStr: string }[] = []
    const today = new Date()
    for (let i = 0; i < 3; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dayName = ARABIC_DAYS[d.getDay()]
      const monthName = ARABIC_MONTHS[d.getMonth()]
      const dateStr = `${d.getDate()} ${monthName}`
      let label: string
      if (i === 0) label = `\u0627\u0644\u064a\u0648\u0645 - ${dateStr}`
      else if (i === 1) label = `\u063a\u062f\u0627\u064b - ${dateStr}`
      else label = `${dayName} - ${dateStr}`
      days.push({ date: d, label, dayName, dateStr })
    }
    return days
  }, [])

  const getTweetsForSlot = useCallback((dayDate: Date, slotHour: number): ScheduledTweet[] => {
    const dayStart = new Date(dayDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayDate)
    dayEnd.setHours(23, 59, 59, 999)

    return scheduledTweets.filter(tweet => {
      const tweetDate = new Date(tweet.scheduledAt)
      if (tweetDate < dayStart || tweetDate > dayEnd) return false
      const hour = tweetDate.getHours()
      if (slotHour === 9) return hour >= 6 && hour < 12
      if (slotHour === 12) return hour >= 12 && hour < 16
      if (slotHour === 16) return hour >= 16 && hour < 20
      if (slotHour === 20) return hour >= 20 || hour < 6
      return false
    })
  }, [scheduledTweets])

  const getSlotTimeLabel = (slot: TimeSlot): string => {
    if (slot.hour === 9) return `${slot.label} \u0635\u0628\u0627\u062d\u0627\u064b`
    if (slot.hour === 12) return `${slot.label} \u0638\u0647\u0631\u0627\u064b`
    if (slot.hour === 16) return `${slot.label} \u0639\u0635\u0631\u0627\u064b`
    return `${slot.label} \u0645\u0633\u0627\u0621\u064b`
  }

  const getSlotIcon = (slot: TimeSlot) => {
    if (slot.icon === 'morning' || slot.icon === 'noon') return <SlotSunIcon />
    if (slot.icon === 'afternoon') return <SlotSunsetIcon />
    return <SlotMoonIcon />
  }

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

  const resetScheduleTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    setScheduledAt(local.toISOString().slice(0, 16))
  }

  const handleSchedule = async () => {
    if (!scheduledAt) {
      setScheduleError(i18n.specifyPublishTime)
      return
    }
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
        setShowNewTweetModal(false)
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
      setShowNewTweetModal(false)
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const hasSourceText = inputMode === 'fetch' ? !!fetchedText : !!directText.trim()
  const sourceText = inputMode === 'fetch' ? fetchedText : directText

  const openNewTweetModal = (prefillTime?: string) => {
    setTweetUrl('')
    setFetchedText('')
    setDirectText('')
    setTranslatedText('')
    setFetchError('')
    setTranslateError('')
    setScheduleError('')
    setIsThreadMode(false)
    setInputMode('fetch')
    setThreadItems([{ text: '', originalText: '' }])
    if (prefillTime) {
      setScheduledAt(prefillTime)
      setPrefilledTime(prefillTime)
    } else {
      resetScheduleTime()
      setPrefilledTime(null)
    }
    setShowNewTweetModal(true)
  }

  const openSlotModal = (dayDate: Date, slotHour: number) => {
    const d = new Date(dayDate)
    d.setHours(slotHour, 0, 0, 0)
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    openNewTweetModal(local.toISOString().slice(0, 16))
  }

  // ==================== RENDER ====================
  if (!i18nReady) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <Spinner size="w-8 h-8" />
      </main>
    )
  }

  const todayFormatted = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div dir="rtl" className="flex min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isDark={isDark}
        toggleTheme={toggleTheme}
        i18n={i18n}
      />

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <MobileHeader setSidebarOpen={setSidebarOpen} />

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-1" style={{ color: 'var(--text)' }}>
                \u0645\u0631\u062d\u0628\u0627\u064b\u060c \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \ud83d\udc4b
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{todayFormatted}</p>
            </div>
            <button
              onClick={() => openNewTweetModal()}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-sm)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            >
              <PlusIcon />
              <span>\u062a\u063a\u0631\u064a\u062f\u0629 \u062c\u062f\u064a\u062f\u0629</span>
            </button>
          </div>

          {/* Status Filter Pills */}
          <StatusPills
            stats={stats}
            filterTab={filterTab}
            setFilterTab={setFilterTab}
            i18n={i18n}
          />

          {/* Calendar Grid */}
          <CalendarGrid
            calendarDays={calendarDays}
            getTweetsForSlot={getTweetsForSlot}
            getSlotIcon={getSlotIcon}
            getSlotTimeLabel={getSlotTimeLabel}
            onSlotClick={openSlotModal}
            onEditTweet={handleOpenEdit}
            i18n={i18n}
          />

          {/* Scheduled Tweets List */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <span className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></span>
                {i18n.scheduledTweets || '\u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0627\u062a \u0627\u0644\u0645\u062c\u062f\u0648\u0644\u0629'}
              </h2>
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}
              >
                {filteredTweets.length} {i18n.tweetUnit || '\u062a\u063a\u0631\u064a\u062f\u0629'}
              </span>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={i18n.searchPlaceholder || '\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0627\u062a...'}
                  className="w-full rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-ring)'
                    e.currentTarget.style.borderColor = 'var(--accent)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Tweet Cards */}
            {filteredTweets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">\ud83d\udceb</div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {searchQuery ? (i18n.noSearchResults || '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c') : (i18n.noTweets || '\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u063a\u0631\u064a\u062f\u0627\u062a \u0645\u062c\u062f\u0648\u0644\u0629')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTweets.map(tweet => (
                  <TweetCard
                    key={tweet.id}
                    tweet={tweet}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onPostNow={handlePostNow}
                    onSelect={toggleSelect}
                    isSelected={selectedIds.has(tweet.id)}
                    loadingPost={loadingPost}
                    loadingDelete={loadingDelete}
                    confirmPostId={confirmPostId}
                    confirmDeleteId={confirmDeleteId}
                    setConfirmPostId={setConfirmPostId}
                    setConfirmDeleteId={setConfirmDeleteId}
                    formatDate={formatDate}
                    i18n={i18n}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Tweet Modal */}
      <NewTweetModal
        showModal={showNewTweetModal}
        setShowModal={setShowNewTweetModal}
        inputMode={inputMode}
        setInputMode={setInputMode}
        tweetUrl={tweetUrl}
        setTweetUrl={setTweetUrl}
        fetchedText={fetchedText}
        loadingFetch={loadingFetch}
        fetchError={fetchError}
        onFetchTweet={handleFetchTweet}
        directText={directText}
        setDirectText={setDirectText}
        isThreadMode={isThreadMode}
        setIsThreadMode={setIsThreadMode}
        threadItems={threadItems}
        addThreadItem={addThreadItem}
        removeThreadItem={removeThreadItem}
        updateThreadItem={updateThreadItem}
        translatedText={translatedText}
        setTranslatedText={setTranslatedText}
        loadingTranslate={loadingTranslate}
        translateError={translateError}
        onTranslate={() => handleTranslate()}
        onTranslateThread={handleTranslateThread}
        language={language}
        setLanguage={setLanguage}
        languages={LANGUAGES}
        scheduledAt={scheduledAt}
        setScheduledAt={setScheduledAt}
        loadingSchedule={loadingSchedule}
        scheduleError={scheduleError}
        onSchedule={handleSchedule}
        hasSourceText={hasSourceText}
        sourceText={sourceText}
        i18n={i18n}
      />

      {/* Confirm Post Modal */}
      {confirmPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-sidebar)' }}
          >
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>{i18n.confirmPublish || '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0646\u0634\u0631'}</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{i18n.confirmPublishMessage || '\u0647\u0644 \u062a\u0631\u064a\u062f \u0646\u0634\u0631 \u0647\u0630\u0647 \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0629 \u0627\u0644\u0622\u0646\u061f'}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handlePostNow(confirmPostId)}
                className="flex-1 py-2.5 font-bold rounded-xl transition-all text-sm cursor-pointer"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
              >
                {i18n.yesPublish || '\u0646\u0639\u0645\u060c \u0627\u0646\u0634\u0631'}
              </button>
              <button
                onClick={() => setConfirmPostId(null)}
                className="flex-1 py-2.5 font-medium rounded-xl transition-all text-sm"
                style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border-light)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
              >
                {i18n.cancel || '\u0625\u0644\u063a\u0627\u0621'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-sidebar)' }}
          >
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>{i18n.confirmDelete || '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062d\u0630\u0641'}</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{i18n.confirmDeleteMessage || '\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0629\u061f'}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 py-2.5 font-bold rounded-xl transition-all text-sm cursor-pointer"
                style={{ backgroundColor: 'var(--error)', color: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--error)')}
              >
                {i18n.yesDelete || '\u0646\u0639\u0645\u060c \u0627\u062d\u0630\u0641'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 font-medium rounded-xl transition-all text-sm"
                style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border-light)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
              >
                {i18n.cancel || '\u0625\u0644\u063a\u0627\u0621'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditModal
        editingTweet={editingTweet}
        editText={editText}
        setEditText={setEditText}
        editTime={editTime}
        setEditTime={setEditTime}
        onSave={handleSaveEdit}
        onClose={() => setEditingTweet(null)}
        loadingEdit={loadingEdit}
        i18n={i18n}
      />

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className="rounded-2xl px-5 py-3 flex items-center gap-3"
            style={{
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text)' }}>
              {selectedIds.size} {i18n.selected || '\u0645\u062d\u062f\u062f'}
            </span>
            <div className="w-px h-6" style={{ backgroundColor: 'var(--border)' }} />
            <button
              onClick={handleBulkPost}
              disabled={loadingBulk}
              className="px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2"
              style={
                loadingBulk
                  ? { backgroundColor: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                  : { backgroundColor: 'var(--accent)', color: '#fff' }
              }
              onMouseEnter={e => { if (!loadingBulk) e.currentTarget.style.backgroundColor = 'var(--accent-hover)' }}
              onMouseLeave={e => { if (!loadingBulk) e.currentTarget.style.backgroundColor = 'var(--accent)' }}
            >
              {loadingBulk ? <Spinner size="w-3 h-3" /> : null}
              {i18n.publishSelected || '\u0646\u0634\u0631 \u0627\u0644\u0645\u062d\u062f\u062f'}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={loadingBulk}
              className="px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2"
              style={
                loadingBulk
                  ? { backgroundColor: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                  : { backgroundColor: 'var(--error)', color: '#fff' }
              }
              onMouseEnter={e => { if (!loadingBulk) e.currentTarget.style.backgroundColor = '#dc2626' }}
              onMouseLeave={e => { if (!loadingBulk) e.currentTarget.style.backgroundColor = 'var(--error)' }}
            >
              {loadingBulk ? <Spinner size="w-3 h-3" /> : null}
              {i18n.deleteSelected || '\u062d\u0630\u0641 \u0627\u0644\u0645\u062d\u062f\u062f'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-sm rounded-xl transition-all"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border-light)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
            >
              {i18n.cancel || '\u0625\u0644\u063a\u0627\u0621'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
