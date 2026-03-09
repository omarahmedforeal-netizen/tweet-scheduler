import { TwitterApi } from 'twitter-api-v2'
import type { ScheduledTweet } from './types'
import { readTweets, writeTweets } from './data'

export type { ScheduledTweet }

function getTwitterClient(): TwitterApi | null {
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessSecret = process.env.TWITTER_ACCESS_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.warn('[Scheduler] Twitter API credentials not configured, skipping auto-post.')
    return null
  }

  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  })
}

export async function runScheduler(): Promise<{
  checked: number
  posted: number
  failed: number
  errors: string[]
}> {
  const result = { checked: 0, posted: 0, failed: 0, errors: [] as string[] }

  try {
    const tweets = await readTweets()
    const now = new Date()

    const dueTweets = tweets.filter(
      t => t.status === 'pending' && new Date(t.scheduledAt) <= now
    )

    result.checked = dueTweets.length

    if (dueTweets.length === 0) {
      return result
    }

    console.log(`[Scheduler] Found ${dueTweets.length} tweet(s) due for posting.`)

    const client = getTwitterClient()
    if (!client) {
      result.errors.push('Twitter API credentials not configured')
      return result
    }

    const rwClient = client.readWrite

    for (const tweet of dueTweets) {
      try {
        console.log(`[Scheduler] Posting tweet id=${tweet.id}`)
        await rwClient.v2.tweet(tweet.translatedText)

        const idx = tweets.findIndex(t => t.id === tweet.id)
        if (idx !== -1) {
          tweets[idx].status = 'posted'
          tweets[idx].postedAt = new Date().toISOString()
        }

        result.posted++
        console.log(`[Scheduler] Posted tweet id=${tweet.id}`)

        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[Scheduler] Failed tweet id=${tweet.id}: ${message}`)

        const idx = tweets.findIndex(t => t.id === tweet.id)
        if (idx !== -1) {
          tweets[idx].status = 'failed'
          tweets[idx].errorMessage = message
        }

        result.failed++
        result.errors.push(`Tweet ${tweet.id}: ${message}`)
      }
    }

    await writeTweets(tweets)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Scheduler] Fatal error:', message)
    result.errors.push(message)
  }

  return result
}

export async function getScheduledTweets(): Promise<ScheduledTweet[]> {
  return readTweets()
}

export async function getPendingTweets(): Promise<ScheduledTweet[]> {
  const tweets = await readTweets()
  return tweets.filter(t => t.status === 'pending')
}

export async function deleteScheduledTweet(id: string): Promise<boolean> {
  const tweets = await readTweets()
  const filtered = tweets.filter(t => t.id !== id)
  if (filtered.length === tweets.length) return false
  await writeTweets(filtered)
  return true
}