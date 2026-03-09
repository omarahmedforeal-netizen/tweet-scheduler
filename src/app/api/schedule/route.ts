import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import type { ScheduledTweet } from '@/lib/types'
import { readTweets, writeTweets } from '@/lib/data'

export async function GET() {
  try {
    const tweets = await readTweets()
    return NextResponse.json({ tweets })
  } catch (err: unknown) {
    console.error('schedule GET error:', err)
    return NextResponse.json({ error: 'فشل قراءة التغريدات' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, originalText, scheduledAt, tweetUrl, thread } = body

    // --- Thread scheduling ---
    if (thread && Array.isArray(thread) && thread.length > 1) {
      if (!scheduledAt) {
        return NextResponse.json({ error: 'وقت الجدولة مطلوب' }, { status: 400 })
      }
      const scheduledDate = new Date(scheduledAt)
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ error: 'وقت الجدولة غير صالح' }, { status: 400 })
      }

      const threadId = uuidv4()
      const newTweets: ScheduledTweet[] = thread.map(
        (item: { text: string; originalText?: string }, index: number) => ({
          id: uuidv4(),
          originalText: item.originalText || '',
          translatedText: item.text,
          scheduledAt: scheduledDate.toISOString(),
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
          tweetUrl: tweetUrl || undefined,
          threadId,
          threadIndex: index,
          isThread: true,
        })
      )

      const tweets = await readTweets()
      tweets.push(...newTweets)
      await writeTweets(tweets)

      return NextResponse.json({ success: true, threadId, tweets: newTweets })
    }

    // --- Single tweet scheduling ---
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'النص المترجم مطلوب' }, { status: 400 })
    }
    if (!scheduledAt) {
      return NextResponse.json({ error: 'وقت الجدولة مطلوب' }, { status: 400 })
    }
    const scheduledDate = new Date(scheduledAt)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'وقت الجدولة غير صالح' }, { status: 400 })
    }

    const newTweet: ScheduledTweet = {
      id: uuidv4(),
      originalText: originalText || '',
      translatedText: text,
      scheduledAt: scheduledDate.toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      tweetUrl: tweetUrl || undefined,
    }

    const tweets = await readTweets()
    tweets.push(newTweet)
    await writeTweets(tweets)

    return NextResponse.json({ success: true, id: newTweet.id, tweet: newTweet })
  } catch (err: unknown) {
    console.error('schedule POST error:', err)
    return NextResponse.json({ error: 'فشل جدولة التغريدة' }, { status: 500 })
  }
}

// --- Edit tweet (PUT) ---
export async function PUT(req: NextRequest) {
  try {
    const { id, translatedText, scheduledAt } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })
    }

    const tweets = await readTweets()
    const idx = tweets.findIndex(t => t.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'التغريدة غير موجودة' }, { status: 404 })
    }

    if (tweets[idx].status !== 'pending') {
      return NextResponse.json(
        { error: 'لا يمكن تعديل تغريدة منشورة أو فاشلة' },
        { status: 400 }
      )
    }

    if (translatedText && typeof translatedText === 'string') {
      tweets[idx].translatedText = translatedText
    }
    if (scheduledAt) {
      const newDate = new Date(scheduledAt)
      if (!isNaN(newDate.getTime())) {
        tweets[idx].scheduledAt = newDate.toISOString()
      }
    }

    await writeTweets(tweets)
    return NextResponse.json({ success: true, tweet: tweets[idx] })
  } catch (err: unknown) {
    console.error('schedule PUT error:', err)
    return NextResponse.json({ error: 'فشل تعديل التغريدة' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()

    // --- Bulk operations ---
    if (body.bulk && Array.isArray(body.ids)) {
      const tweets = await readTweets()
      const { ids, action: bulkAction } = body as {
        ids: string[]
        action: string
        bulk: true
      }

      if (bulkAction === 'delete') {
        const filtered = tweets.filter(t => !ids.includes(t.id))
        await writeTweets(filtered)
        return NextResponse.json({
          success: true,
          deleted: tweets.length - filtered.length,
        })
      }

      if (body.status) {
        let updated = 0
        for (const id of ids) {
          const idx = tweets.findIndex(t => t.id === id)
          if (idx !== -1) {
            tweets[idx].status = body.status
            if (body.status === 'pending') {
              tweets[idx].errorMessage = undefined
            }
            updated++
          }
        }
        await writeTweets(tweets)
        return NextResponse.json({ success: true, updated })
      }

      return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
    }

    // --- Single tweet status update ---
    const { id, status, errorMessage, postedAt } = body
    if (!id || !status) {
      return NextResponse.json(
        { error: 'id و status مطلوبان' },
        { status: 400 }
      )
    }
    const tweets = await readTweets()
    const idx = tweets.findIndex(t => t.id === id)
    if (idx === -1) {
      return NextResponse.json(
        { error: 'التغريدة غير موجودة' },
        { status: 404 }
      )
    }
    tweets[idx].status = status
    if (errorMessage) tweets[idx].errorMessage = errorMessage
    if (postedAt) tweets[idx].postedAt = postedAt
    await writeTweets(tweets)
    return NextResponse.json({ success: true, tweet: tweets[idx] })
  } catch (err: unknown) {
    console.error('schedule PATCH error:', err)
    return NextResponse.json(
      { error: 'فشل تحديث التغريدة' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()

    // --- Bulk delete ---
    if (body.ids && Array.isArray(body.ids)) {
      const tweets = await readTweets()
      const filtered = tweets.filter(t => !body.ids.includes(t.id))
      await writeTweets(filtered)
      return NextResponse.json({
        success: true,
        deleted: tweets.length - filtered.length,
      })
    }

    // --- Single delete ---
    const { id } = body
    if (!id) {
      return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })
    }
    const tweets = await readTweets()
    const filtered = tweets.filter(t => t.id !== id)
    if (filtered.length === tweets.length) {
      return NextResponse.json(
        { error: 'التغريدة غير موجودة' },
        { status: 404 }
      )
    }
    await writeTweets(filtered)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('schedule DELETE error:', err)
    return NextResponse.json(
      { error: 'فشل حذف التغريدة' },
      { status: 500 }
    )
  }
}
