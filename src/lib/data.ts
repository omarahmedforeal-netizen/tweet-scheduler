import { promises as fs } from 'fs'
import path from 'path'
import type { ScheduledTweet } from './types'

const DATA_FILE = path.join(process.cwd(), 'data', 'scheduled.json')

export async function readTweets(): Promise<ScheduledTweet[]> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as ScheduledTweet[]
  } catch {
    return []
  }
}

export async function writeTweets(tweets: ScheduledTweet[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(tweets, null, 2), 'utf-8')
}