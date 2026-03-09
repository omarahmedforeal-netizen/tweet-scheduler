import { Redis } from '@upstash/redis'
import type { ScheduledTweet } from './types'

const redis = Redis.fromEnv()

const KEY = 'scheduled_tweets'

export async function readTweets(): Promise<ScheduledTweet[]> {
  try {
    const data = await redis.get<ScheduledTweet[]>(KEY)
    return data ?? []
  } catch {
    return []
  }
}

export async function writeTweets(tweets: ScheduledTweet[]): Promise<void> {
  await redis.set(KEY, tweets)
}
