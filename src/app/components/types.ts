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

export const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export const FALLBACK_I18N: I18nStrings = {}

export function buildLanguages(i18n: I18nStrings) {
  return [
    { value: 'saudi', label: i18n.langSaudi || 'السعودية' },
    { value: 'egyptian', label: i18n.langEgyptian || 'المصرية' },
    { value: 'standard', label: i18n.langStandard || 'الفصحى' },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'Français' },
  ]
}
