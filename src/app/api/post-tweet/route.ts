import { NextRequest, NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'
import { readTweets, writeTweets } from '@/lib/data'

function getTwitterClient(): TwitterApi {
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessSecret = process.env.TWITTER_ACCESS_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error(
      'بيانات Twitter API غير مضبوطة. تحقق من TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET في .env.local'
    )
  }

  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { id, bulk, ids } = await req.json()

    // --- Bulk post ---
    if (bulk && Array.isArray(ids) && ids.length > 0) {
      let client: TwitterApi
      try {
        client = getTwitterClient()
      } catch (err: unknown) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'خطأ في إعداد Twitter API' },
          { status: 500 }
        )
      }

      const rwClient = client.readWrite
      const tweets = await readTweets()
      let posted = 0
      let failed = 0

      for (const tweetId of ids) {
        const idx = tweets.findIndex(t => t.id === tweetId)
        if (idx === -1 || tweets[idx].status !== 'pending') continue

        try {
          await rwClient.v2.tweet(tweets[idx].translatedText)
          tweets[idx].status = 'posted'
          tweets[idx].postedAt = new Date().toISOString()
          posted++
          // Rate limit delay
          await new Promise(resolve => setTimeout(resolve, 1500))
        } catch (err: unknown) {
          tweets[idx].status = 'failed'
          tweets[idx].errorMessage = err instanceof Error ? err.message : 'فشل النشر'
          failed++
        }
      }

      await writeTweets(tweets)
      return NextResponse.json({ success: true, posted, failed })
    }

    // --- Single tweet or thread post ---
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'معرف التغريدة (id) مطلوب' }, { status: 400 })
    }

    const tweets = await readTweets()
    const idx = tweets.findIndex(t => t.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: 'التغريدة غير موجودة' }, { status: 404 })
    }

    const tweet = tweets[idx]

    if (tweet.status === 'posted') {
      return NextResponse.json({ error: 'هذه التغريدة نُشرت مسبقاً' }, { status: 409 })
    }

    let client: TwitterApi
    try {
      client = getTwitterClient()
    } catch (err: unknown) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'خطأ في إعداد Twitter API' },
        { status: 500 }
      )
    }

    const rwClient = client.readWrite

    // --- Thread posting ---
    if (tweet.isThread && tweet.threadId) {
      const threadTweets = tweets
        .filter(t => t.threadId === tweet.threadId && t.status === 'pending')
        .sort((a, b) => (a.threadIndex || 0) - (b.threadIndex || 0))

      if (threadTweets.length === 0) {
        return NextResponse.json({ error: 'لا توجد تغريدات معلقة في هذا الثريد' }, { status: 400 })
      }

      let lastTweetId: string | undefined
      const postedIds: string[] = []

      for (const threadTweet of threadTweets) {
        try {
          const payload: { text: string; reply?: { in_reply_to_tweet_id: string } } = {
            text: threadTweet.translatedText,
          }

          if (lastTweetId) {
            payload.reply = { in_reply_to_tweet_id: lastTweetId }
          }

          const posted = await rwClient.v2.tweet(payload)
          lastTweetId = posted.data.id

          const tIdx = tweets.findIndex(t => t.id === threadTweet.id)
          if (tIdx !== -1) {
            tweets[tIdx].status = 'posted'
            tweets[tIdx].postedAt = new Date().toISOString()
          }
          postedIds.push(threadTweet.id)

          // Delay between thread tweets
          await new Promise(resolve => setTimeout(resolve, 1500))
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'فشل نشر التغريدة'
          const tIdx = tweets.findIndex(t => t.id === threadTweet.id)
          if (tIdx !== -1) {
            tweets[tIdx].status = 'failed'
            tweets[tIdx].errorMessage = message
          }
          // Stop thread on first failure
          break
        }
      }

      await writeTweets(tweets)
      return NextResponse.json({
        success: true,
        thread: true,
        posted: postedIds.length,
        total: threadTweets.length,
      })
    }

    // --- Single tweet posting ---
    const postedTweet = await rwClient.v2.tweet(tweet.translatedText)

    tweets[idx].status = 'posted'
    tweets[idx].postedAt = new Date().toISOString()
    await writeTweets(tweets)

    return NextResponse.json({
      success: true,
      tweetId: postedTweet.data.id,
      tweetText: postedTweet.data.text,
    })
  } catch (err: unknown) {
    console.error('post-tweet error:', err)
    const message = err instanceof Error ? err.message : 'فشل نشر التغريدة'

    try {
      const { id } = await req.clone().json()
      if (id) {
        const tweets = await readTweets()
        const idx = tweets.findIndex(t => t.id === id)
        if (idx !== -1) {
          tweets[idx].status = 'failed'
          tweets[idx].errorMessage = message
          await writeTweets(tweets)
        }
      }
    } catch {
      // ignore secondary error
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
