// ==================== TYPES ====================

export interface ScheduledTweet {
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

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export interface ThreadItem {
  text: string
  originalText: string
}

export interface TimeSlot {
  key: string
  hour: number
  label: string
  icon: 'morning' | 'noon' | 'afternoon' | 'evening'
}

export type I18nStrings = Record<string, string>

export type FilterTab = 'all' | 'pending' | 'posted' | 'failed'

export type NavSection = 'schedule' | 'ai-write' | 'amazon-marketing' | 'amazon-browse' | 'rewrite'

// ==================== CONSTANTS ====================

export const CHAR_LIMIT = 280

export const TIME_SLOTS: TimeSlot[] = [
  { key: '09', hour: 9, label: '09:00', icon: 'morning' },
  { key: '12', hour: 12, label: '12:00', icon: 'noon' },
  { key: '16', hour: 16, label: '16:00', icon: 'afternoon' },
  { key: '20', hour: 20, label: '20:00', icon: 'evening' },
]

export const ARABIC_DAYS = ['\u0627\u0644\u0623\u062d\u062f', '\u0627\u0644\u0627\u062b\u0646\u064a\u0646', '\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621', '\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621', '\u0627\u0644\u062e\u0645\u064a\u0633', '\u0627\u0644\u062c\u0645\u0639\u0629', '\u0627\u0644\u0633\u0628\u062a']

export const ARABIC_MONTHS = ['\u064a\u0646\u0627\u064a\u0631', '\u0641\u0628\u0631\u0627\u064a\u0631', '\u0645\u0627\u0631\u0633', '\u0623\u0628\u0631\u064a\u0644', '\u0645\u0627\u064a\u0648', '\u064a\u0648\u0646\u064a\u0648', '\u064a\u0648\u0644\u064a\u0648', '\u0623\u063a\u0633\u0637\u0633', '\u0633\u0628\u062a\u0645\u0628\u0631', '\u0623\u0643\u062a\u0648\u0628\u0631', '\u0646\u0648\u0641\u0645\u0628\u0631', '\u062f\u064a\u0633\u0645\u0628\u0631']

export const FALLBACK_I18N: I18nStrings = {}

export function buildLanguages(i18n: I18nStrings) {
  return [
    { value: 'saudi', label: i18n.langSaudi || '\u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629' },
    { value: 'egyptian', label: i18n.langEgyptian || '\u0627\u0644\u0645\u0635\u0631\u064a\u0629' },
    { value: 'standard', label: i18n.langStandard || '\u0627\u0644\u0641\u0635\u062d\u0649' },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'Fran\u00e7ais' },
  ]
}
