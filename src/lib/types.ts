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
  // Thread support
  threadId?: string
  threadIndex?: number
  isThread?: boolean
}
