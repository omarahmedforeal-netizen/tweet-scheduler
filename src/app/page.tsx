'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// i18n loaded at runtime via fetch to prevent Next.js minifier from escaping Arabic
type I18nStrings = Record<string, string>
const FALLBACK_I18N: I18nStrings = {}

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

interface TimeSlot {
  key: string
  hour: number
  label: string
  icon: 'morning' | 'noon' | 'afternoon' | 'evening'
}

// ==================== CONSTANTS ====================
const CHAR_LIMIT = 280
type FilterTab = 'all' | 'pending' | 'posted' | 'failed'

let toastCounter = 0

const TIME_SLOTS: TimeSlot[] = [
  { key: '09', hour: 9, label: '09:00', icon: 'morning' },
  { key: '12', hour: 12, label: '12:00', icon: 'noon' },
  { key: '16', hour: 16, label: '16:00', icon: 'afternoon' },
  { key: '20', hour: 20, label: '20:00', icon: 'evening' },
]

const ARABIC_DAYS = ['\u0627\u0644\u0623\u062d\u062f', '\u0627\u0644\u0627\u062b\u0646\u064a\u0646', '\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621', '\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621', '\u0627\u0644\u062e\u0645\u064a\u0633', '\u0627\u0644\u062c\u0645\u0639\u0629', '\u0627\u0644\u0633\u0628\u062a']
const ARABIC_MONTHS = ['\u064a\u0646\u0627\u064a\u0631', '\u0641\u0628\u0631\u0627\u064a\u0631', '\u0645\u0627\u0631\u0633', '\u0623\u0628\u0631\u064a\u0644', '\u0645\u0627\u064a\u0648', '\u064a\u0648\u0646\u064a\u0648', '\u064a\u0648\u0644\u064a\u0648', '\u0623\u063a\u0633\u0637\u0633', '\u0633\u0628\u062a\u0645\u0628\u0631', '\u0623\u0643\u062a\u0648\u0628\u0631', '\u0646\u0648\u0641\u0645\u0628\u0631', '\u062f\u064a\u0633\u0645\u0628\u0631']

type NavSection = 'schedule' | 'ai-write' | 'amazon-marketing' | 'amazon-browse' | 'rewrite'

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

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
)

const SparkleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
  </svg>
)

const CartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
)

const BrowseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
  </svg>
)

const GearIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const SlotSunIcon = () => (
  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
  </svg>
)

const SlotSunsetIcon = () => (
  <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12z" />
  </svg>
)

const SlotMoonIcon = () => (
  <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
  </svg>
)

// ==================== MAIN COMPONENT ====================
export default function Home() {
  // --- i18n ---
  const [i18n, setI18n] = useState<I18nStrings>(FALLBACK_I18N)
  const [i18nReady, setI18nReady] = useState(false)

  // --- Theme ---
  const [isDark, setIsDark] = useState(false)

  // --- Sidebar ---
  const [activeSection, setActiveSection] = useState<NavSection>('schedule')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // --- New Tweet Modal ---
  const [showNewTweetModal, setShowNewTweetModal] = useState(false)
  const [prefilledTime, setPrefilledTime] = useState<string | null>(null)

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

  // ==================== I18N LOADING ====================
  const LANGUAGES = useMemo(() => [
    { value: 'saudi', label: i18n.langSaudi || '\u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629' },
    { value: 'egyptian', label: i18n.langEgyptian || '\u0627\u0644\u0645\u0635\u0631\u064a\u0629' },
    { value: 'standard', label: i18n.langStandard || '\u0627\u0644\u0641\u0635\u062d\u0649' },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'Fran\u00e7ais' },
  ], [i18n])

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
    if (stored === 'dark') {
      setIsDark(true)
      document.documentElement.classList.remove('light')
    } else {
      setIsDark(false)
      document.documentElement.classList.add('light')
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

  const truncate = (text: string, max = 120) =>
    text.length > max ? text.slice(0, max) + '...' : text

  const charCount = translatedText.length
  const charOver = charCount > CHAR_LIMIT
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
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
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

  const navItems: { key: NavSection; label: string; icon: JSX.Element }[] = [
    { key: 'schedule', label: '\u062c\u062f\u0648\u0644\u0629 \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0627\u062a', icon: <CalendarIcon /> },
    { key: 'ai-write', label: '\u0643\u062a\u0627\u0628\u0629 \u062a\u063a\u0631\u064a\u062f\u0627\u062a \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a', icon: <SparkleIcon /> },
    { key: 'amazon-marketing', label: '\u062a\u0633\u0648\u064a\u0642 \u0645\u0646\u062a\u062c\u0627\u062a \u0623\u0645\u0627\u0632\u0648\u0646', icon: <CartIcon /> },
    { key: 'amazon-browse', label: '\u062a\u0635\u0641\u062d \u0645\u0646\u062a\u062c\u0627\u062a \u0623\u0645\u0627\u0632\u0648\u0646', icon: <BrowseIcon /> },
    { key: 'rewrite', label: '\u0625\u0639\u0627\u062f\u0629 \u0643\u062a\u0627\u0628\u0629 \u062a\u063a\u0631\u064a\u062f\u0629', icon: <RefreshIcon /> },
  ]

  return (
    <div dir="rtl" className="flex min-h-screen bg-gray-50 font-sans">

      {/* ==================== TOAST NOTIFICATIONS ==================== */}
      <div className="fixed top-4 left-4 right-4 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto max-w-md w-full px-4 py-3 rounded-xl shadow-lg border cursor-pointer transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}
            dir="rtl"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{toast.type === 'success' ? '\u2713' : toast.type === 'error' ? '\u2717' : '\u2139'}</span>
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== MOBILE SIDEBAR OVERLAY ==================== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ==================== RIGHT SIDEBAR ==================== */}
      <aside
        className={`fixed top-0 right-0 h-full w-[260px] bg-white border-l border-gray-200 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">Postlate</span>
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="mr-auto lg:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <CloseIcon />
          </button>
        </div>

        {/* User Profile */}
        <div className="px-5 py-4 border-t border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              \u0645
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-900">\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Pro</span>
              </div>
              <p className="text-xs text-gray-400 truncate">user@postlate.com</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => { setActiveSection(item.key); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === item.key
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={activeSection === item.key ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Settings & Theme at bottom */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <span className="text-gray-400">{isDark ? <SunIcon /> : <MoonIcon />}</span>
            <span>{isDark ? (i18n.lightMode || '\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0641\u0627\u062a\u062d') : (i18n.darkMode || '\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u062f\u0627\u0643\u0646')}</span>
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <span className="text-gray-400"><GearIcon /></span>
            <span>\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a</span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {/* Mobile header with hamburger */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Postlate</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <MenuIcon />
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header section */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-1">
                \u0645\u0631\u062d\u0628\u0627\u064b\u060c \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \ud83d\udc4b
              </h1>
              <p className="text-sm text-gray-500 mt-1">{todayFormatted}</p>
            </div>
            <button
              onClick={() => openNewTweetModal()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <PlusIcon />
              <span>\u062a\u063a\u0631\u064a\u062f\u0629 \u062c\u062f\u064a\u062f\u0629</span>
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <button
              onClick={() => setFilterTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                filterTab === 'all'
                  ? 'bg-gray-100 border-gray-300 text-gray-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>\u0645\u0633\u0648\u062f\u0627\u062a</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{stats.total}</span>
            </button>
            <button
              onClick={() => setFilterTab('failed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                filterTab === 'failed'
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-red-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>\u0641\u0634\u0644\u062a</span>
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{stats.failed}</span>
            </button>
            <button
              onClick={() => setFilterTab('posted')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                filterTab === 'posted'
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-green-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>\u062a\u0645 \u0646\u0634\u0631\u0647\u0627</span>
              <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">{stats.posted}</span>
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                filterTab === 'pending'
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-blue-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{stats.pending}</span>
            </button>
          </div>

          {/* ==================== CALENDAR GRID ==================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {calendarDays.map((day, dayIdx) => (
              <div key={dayIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Column header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">{day.label}</h3>
                </div>
                {/* Time slots */}
                <div className="p-3 space-y-2">
                  {TIME_SLOTS.map(slot => {
                    const tweetsInSlot = getTweetsForSlot(day.date, slot.hour)
                    return (
                      <div
                        key={slot.key}
                        className="border border-gray-100 rounded-lg p-2.5 hover:border-gray-200 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {getSlotIcon(slot)}
                            <span className="text-xs font-medium text-gray-600" dir="ltr">{getSlotTimeLabel(slot)}</span>
                          </div>
                          <button
                            onClick={() => openSlotModal(day.date, slot.hour)}
                            className="w-6 h-6 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        {/* Tweets in this slot */}
                        {tweetsInSlot.length > 0 && (
                          <div className="space-y-1.5 mt-2">
                            {tweetsInSlot.map(tweet => (
                              <div
                                key={tweet.id}
                                className={`text-xs p-2 rounded-md border cursor-pointer transition-all hover:shadow-sm ${
                                  tweet.status === 'posted'
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : tweet.status === 'failed'
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}
                                onClick={() => {
                                  if (tweet.status === 'pending') handleOpenEdit(tweet)
                                }}
                              >
                                <p className="line-clamp-2 leading-relaxed" dir="rtl">{truncate(tweet.translatedText, 60)}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="opacity-70" dir="ltr">
                                    {new Date(tweet.scheduledAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className={`text-[10px] font-medium ${
                                    tweet.status === 'posted' ? 'text-green-600' : tweet.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                                  }`}>
                                    {tweet.status === 'posted' ? '\u2713 \u0646\u064f\u0634\u0631' : tweet.status === 'failed' ? '\u2717 \u0641\u0634\u0644' : '\u23f3 \u0627\u0646\u062a\u0638\u0627\u0631'}
                                  </span>
                                </div>
                                {tweet.isThread && (
                                  <span className="text-[10px] opacity-60">\u0633\u0644\u0633\u0644\u0629 {(tweet.threadIndex || 0) + 1}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ==================== SCHEDULED TWEETS LIST ==================== */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                {i18n.scheduledTweets || '\u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0627\u062a \u0627\u0644\u0645\u062c\u062f\u0648\u0644\u0629'}
              </h2>
              <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                {filteredTweets.length} {i18n.tweetUnit || '\u062a\u063a\u0631\u064a\u062f\u0629'}
              </span>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={i18n.searchPlaceholder || '\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0627\u062a...'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Tweet Cards */}
            {filteredTweets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">\ud83d\udceb</div>
                <p className="text-gray-400 text-sm">
                  {searchQuery ? (i18n.noSearchResults || '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c') : (i18n.noTweets || '\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u063a\u0631\u064a\u062f\u0627\u062a \u0645\u062c\u062f\u0648\u0644\u0629')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTweets.map(tweet => (
                  <div
                    key={tweet.id}
                    className={`rounded-xl p-4 border transition-all ${
                      selectedIds.has(tweet.id)
                        ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tweet.id)}
                        onChange={() => toggleSelect(tweet.id)}
                        className="mt-1 shrink-0 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-800 leading-relaxed flex-1" dir="rtl">
                            {truncate(tweet.translatedText, 150)}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {tweet.isThread && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                                {i18n.thread || '\u0633\u0644\u0633\u0644\u0629'} {(tweet.threadIndex || 0) + 1}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              tweet.status === 'posted'
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : tweet.status === 'failed'
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}>
                              {tweet.status === 'posted' ? `\u2713 ${i18n.statusPublished || '\u0646\u064f\u0634\u0631'}`
                              : tweet.status === 'failed' ? `\u2717 ${i18n.statusFailed || '\u0641\u0634\u0644'}`
                              : `\u23f3 ${i18n.statusPending || '\u0627\u0646\u062a\u0638\u0627\u0631'}`}
                            </span>
                          </div>
                        </div>
                        {tweet.errorMessage && (
                          <p className="text-xs text-red-500 mt-1">\u26a0 {tweet.errorMessage}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mr-7">
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <span>\ud83d\udd52</span>
                        <span dir="ltr">{formatDate(tweet.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tweet.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(tweet)}
                              className="text-xs px-2 py-1.5 rounded-lg transition-all text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              title={i18n.edit || '\u062a\u0639\u062f\u064a\u0644'}
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => setConfirmPostId(tweet.id)}
                              disabled={loadingPost === tweet.id}
                              className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg transition-all disabled:opacity-50"
                            >
                              {loadingPost === tweet.id ? <Spinner size="w-3 h-3" /> : (i18n.publishNow || '\u0646\u0634\u0631 \u0627\u0644\u0622\u0646')}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setConfirmDeleteId(tweet.id)}
                          disabled={loadingDelete === tweet.id}
                          className="text-xs px-2 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 rounded-lg transition-all disabled:opacity-50"
                          title={i18n.delete || '\u062d\u0630\u0641'}
                        >
                          {loadingDelete === tweet.id ? <Spinner size="w-3 h-3" /> : <TrashIcon />}
                        </button>
                        {tweet.tweetUrl && (
                          <a
                            href={tweet.tweetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                            dir="ltr"
                          >
                            {i18n.source || '\u0627\u0644\u0645\u0635\u062f\u0631'} \u2197
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ==================== NEW TWEET MODAL ==================== */}
      {showNewTweetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">\u062a\u063a\u0631\u064a\u062f\u0629 \u062c\u062f\u064a\u062f\u0629</h3>
              <button
                onClick={() => setShowNewTweetModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-6">
              {/* Input Mode Toggle */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-full">
                  <button
                    onClick={() => { setInputMode('fetch'); setIsThreadMode(false) }}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inputMode === 'fetch' && !isThreadMode
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {i18n.fetchFromUrl || '\u062c\u0644\u0628 \u062a\u063a\u0631\u064a\u062f\u0629'}
                  </button>
                  <button
                    onClick={() => { setInputMode('write'); setIsThreadMode(false) }}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inputMode === 'write' && !isThreadMode
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {i18n.writeMode || '\u0643\u062a\u0627\u0628\u0629'}
                  </button>
                </div>
              </div>

              {/* Thread toggle */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setIsThreadMode(!isThreadMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    isThreadMode
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {i18n.thread || '\u0633\u0644\u0633\u0644\u0629'} {isThreadMode ? '\u2713' : ''}
                </button>
              </div>

              {/* ===== FETCH MODE ===== */}
              {inputMode === 'fetch' && !isThreadMode && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-500 mb-2">{i18n.tweetUrl || '\u0631\u0627\u0628\u0637 \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0629'}</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={tweetUrl}
                        onChange={e => setTweetUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleFetchTweet()}
                        placeholder="https://twitter.com/user/status/..."
                        dir="ltr"
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                      />
                      <button
                        onClick={handleFetchTweet}
                        disabled={loadingFetch || !tweetUrl.trim()}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
                      >
                        {loadingFetch ? <Spinner /> : (i18n.fetch || '\u062c\u0644\u0628')}
                      </button>
                    </div>
                    {fetchError && <p className="mt-2 text-red-500 text-sm">\u26a0 {fetchError}</p>}
                  </div>

                  {fetchedText && (
                    <div className="mb-4">
                      <label className="block text-sm text-gray-500 mb-2">{i18n.originalText || '\u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064a'}</label>
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed" dir="auto">{fetchedText}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== WRITE MODE ===== */}
              {inputMode === 'write' && !isThreadMode && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-500 mb-2">{i18n.writeYourTweet || '\u0627\u0643\u062a\u0628 \u062a\u063a\u0631\u064a\u062f\u062a\u0643'}</label>
                    <textarea
                      value={directText}
                      onChange={e => setDirectText(e.target.value)}
                      rows={4}
                      placeholder={i18n.writeTweetPlaceholder || '\u0627\u0643\u062a\u0628 \u062a\u063a\u0631\u064a\u062f\u062a\u0643 \u0647\u0646\u0627...'}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm leading-relaxed resize-none placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                      dir="rtl"
                    />
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs font-mono ${directText.length > CHAR_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
                        {directText.length}/{CHAR_LIMIT}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== THREAD MODE ===== */}
              {isThreadMode && (
                <div>
                  <div className="space-y-3 mb-4">
                    {threadItems.map((item, index) => (
                      <div key={index} className="relative">
                        {index > 0 && (
                          <div className="absolute right-5 -top-3 w-0.5 h-3 bg-blue-300 opacity-40" />
                        )}
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                              {index + 1}/{threadItems.length}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-mono ${item.text.length > CHAR_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
                                {item.text.length}/{CHAR_LIMIT}
                              </span>
                              {threadItems.length > 1 && (
                                <button onClick={() => removeThreadItem(index)} className="p-1 rounded-lg hover:bg-red-50 text-red-400 transition-all">
                                  <MinusIcon />
                                </button>
                              )}
                            </div>
                          </div>
                          <textarea
                            value={item.text}
                            onChange={e => updateThreadItem(index, 'text', e.target.value)}
                            rows={3}
                            placeholder={`${i18n.tweetNumber || '\u062a\u063a\u0631\u064a\u062f\u0629'} ${index + 1}...`}
                            className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none placeholder-gray-400"
                            dir="rtl"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addThreadItem}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <PlusIcon /> {i18n.addTweet || '\u0625\u0636\u0627\u0641\u0629 \u062a\u063a\u0631\u064a\u062f\u0629'}
                  </button>
                </div>
              )}

              {/* ===== LANGUAGE SELECTOR ===== */}
              {(hasSourceText || isThreadMode) && (
                <div className="mt-4 mb-4">
                  <label className="block text-sm text-gray-500 mb-2">{i18n.translationLanguage || '\u0644\u063a\u0629 \u0627\u0644\u062a\u0631\u062c\u0645\u0629'}</label>
                  <div className="flex gap-2 flex-wrap">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.value}
                        onClick={() => setLanguage(lang.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          language === lang.value
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => isThreadMode ? handleTranslateThread() : handleTranslate()}
                    disabled={loadingTranslate || (isThreadMode ? threadItems.every(i => !i.text.trim()) : !sourceText.trim())}
                    className="mt-3 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm flex items-center gap-2"
                  >
                    {loadingTranslate ? <><Spinner /> {i18n.translating || '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0631\u062c\u0645\u0629...'}</> : (i18n.translate || '\u062a\u0631\u062c\u0645\u0629')}
                  </button>
                  {translateError && <p className="mt-2 text-red-500 text-sm">\u26a0 {translateError}</p>}
                </div>
              )}

              {/* ===== TRANSLATED TEXT (single mode) ===== */}
              {!isThreadMode && (loadingTranslate || translatedText) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-500">{i18n.translatedText || '\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u062a\u0631\u062c\u0645'}</label>
                    {!loadingTranslate && translatedText && (
                      <span className={`text-xs font-mono ${charOver ? 'text-red-500' : charCount > CHAR_LIMIT * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {charCount}/{CHAR_LIMIT}
                      </span>
                    )}
                  </div>
                  <div className={`rounded-xl p-3 bg-gray-50 border ${charOver ? 'border-red-300' : 'border-gray-200'}`}>
                    {loadingTranslate ? (
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <Spinner size="w-4 h-4" /> {i18n.translating || '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0631\u062c\u0645\u0629...'}
                      </div>
                    ) : (
                      <textarea
                        value={translatedText}
                        onChange={e => setTranslatedText(e.target.value)}
                        rows={4}
                        className="w-full bg-transparent text-sm text-gray-800 leading-relaxed resize-none focus:outline-none"
                        dir="rtl"
                      />
                    )}
                  </div>
                  {charOver && <p className="mt-1 text-red-500 text-xs">{i18n.charLimitExceeded || '\u062a\u062c\u0627\u0648\u0632\u062a \u0627\u0644\u062d\u062f \u0627\u0644\u0645\u0633\u0645\u0648\u062d'} ({CHAR_LIMIT} {i18n.charUnit || '\u062d\u0631\u0641'})</p>}
                </div>
              )}

              {/* ===== SCHEDULE TIME ===== */}
              {((translatedText && !loadingTranslate && !isThreadMode) || (isThreadMode && threadItems.some(i => i.text.trim()))) && (
                <div className="mb-5">
                  <label className="block text-sm text-gray-500 mb-2">{i18n.publishTimeLabel || '\u0648\u0642\u062a \u0627\u0644\u0646\u0634\u0631'}</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                  />
                </div>
              )}

              {/* ===== SCHEDULE BUTTON ===== */}
              {((translatedText && !loadingTranslate && !isThreadMode) || (isThreadMode && threadItems.some(i => i.text.trim()))) && (
                <div>
                  {scheduleError && <p className="mb-3 text-red-500 text-sm">\u26a0 {scheduleError}</p>}
                  <button
                    onClick={handleSchedule}
                    disabled={loadingSchedule || (!isThreadMode && charOver)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm"
                  >
                    {loadingSchedule ? (
                      <span className="flex items-center justify-center gap-2"><Spinner size="w-5 h-5" /> {i18n.scheduling || '\u062c\u0627\u0631\u064a \u0627\u0644\u062c\u062f\u0648\u0644\u0629...'}</span>
                    ) : isThreadMode ? `${i18n.scheduleThread || '\u062c\u062f\u0648\u0644\u0629 \u0627\u0644\u0633\u0644\u0633\u0644\u0629'} (${threadItems.filter(i => i.text.trim()).length} ${i18n.tweetsUnit || '\u062a\u063a\u0631\u064a\u062f\u0627\u062a'})` : (i18n.schedulePublish || '\u062c\u062f\u0648\u0644\u0629 \u0627\u0644\u0646\u0634\u0631')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== CONFIRM POST MODAL ==================== */}
      {confirmPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">{i18n.confirmPublish || '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0646\u0634\u0631'}</h3>
            <p className="text-sm text-gray-500 mb-5">{i18n.confirmPublishMessage || '\u0647\u0644 \u062a\u0631\u064a\u062f \u0646\u0634\u0631 \u0647\u0630\u0647 \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0629 \u0627\u0644\u0622\u0646\u061f'}</p>
            <div className="flex gap-3">
              <button onClick={() => handlePostNow(confirmPostId)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm">
                {i18n.yesPublish || '\u0646\u0639\u0645\u060c \u0627\u0646\u0634\u0631'}
              </button>
              <button onClick={() => setConfirmPostId(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all text-sm">
                {i18n.cancel || '\u0625\u0644\u063a\u0627\u0621'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CONFIRM DELETE MODAL ==================== */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">{i18n.confirmDelete || '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062d\u0630\u0641'}</h3>
            <p className="text-sm text-gray-500 mb-5">{i18n.confirmDeleteMessage || '\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0629\u061f'}</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all text-sm">
                {i18n.yesDelete || '\u0646\u0639\u0645\u060c \u0627\u062d\u0630\u0641'}
              </button>
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all text-sm">
                {i18n.cancel || '\u0625\u0644\u063a\u0627\u0621'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT MODAL ==================== */}
      {editingTweet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <EditIcon /> {i18n.editTweet || '\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0629'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-500 mb-2">{i18n.textLabel || '\u0627\u0644\u0646\u0635'}</label>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                dir="rtl"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs font-mono ${editText.length > CHAR_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
                  {editText.length}/{CHAR_LIMIT}
                </span>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm text-gray-500 mb-2">{i18n.publishTimeLabel || '\u0648\u0642\u062a \u0627\u0644\u0646\u0634\u0631'}</label>
              <input
                type="datetime-local"
                value={editTime}
                onChange={e => setEditTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={loadingEdit || editText.length > CHAR_LIMIT || !editText.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                {loadingEdit ? <><Spinner /> {i18n.saving || '\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...'}</> : (i18n.saveChanges || '\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a')}
              </button>
              <button onClick={() => setEditingTweet(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all text-sm">
                {i18n.cancel || '\u0625\u0644\u063a\u0627\u0621'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BULK ACTION BAR ==================== */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl border border-gray-200">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {selectedIds.size} {i18n.selected || '\u0645\u062d\u062f\u062f'}
            </span>
            <div className="w-px h-6 bg-gray-200" />
            <button
              onClick={handleBulkPost}
              disabled={loadingBulk}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
            >
              {loadingBulk ? <Spinner size="w-3 h-3" /> : null}
              {i18n.publishSelected || '\u0646\u0634\u0631 \u0627\u0644\u0645\u062d\u062f\u062f'}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={loadingBulk}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
            >
              {loadingBulk ? <Spinner size="w-3 h-3" /> : null}
              {i18n.deleteSelected || '\u062d\u0630\u0641 \u0627\u0644\u0645\u062d\u062f\u062f'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-xl transition-all"
            >
              {i18n.cancel || '\u0625\u0644\u063a\u0627\u0621'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}