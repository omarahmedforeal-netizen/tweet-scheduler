import { NextRequest, NextResponse } from 'next/server'

/**
 * Extract the tweet ID from a Twitter/X URL.
 */
function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Primary: Use Twitter oEmbed API (free, no auth).
 */
async function fetchViaOembed(url: string): Promise<string | null> {
  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&hide_media=true&hide_thread=true`
  const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) return null

  const data = await res.json()
  if (!data.html) return null

  // The oEmbed HTML contains a <blockquote> with the tweet text inside <p> tags
  const pMatch = data.html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (!pMatch) return null

  return pMatch[1]
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/**
 * Fallback: Use Twitter syndication API.
 */
async function fetchViaSyndication(tweetId: string): Promise<string | null> {
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return null

  const data = await res.json()
  // The syndication API returns the tweet text in `text` field
  return typeof data.text === 'string' ? data.text.trim() : null
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'رابط التغريدة مطلوب' }, { status: 400 })
    }

    // Validate it looks like a Twitter/X URL
    if (!url.includes('twitter.com') && !url.includes('x.com')) {
      return NextResponse.json(
        { error: 'يرجى إدخال رابط صحيح من Twitter/X' },
        { status: 400 }
      )
    }

    const tweetId = extractTweetId(url)
    if (!tweetId) {
      return NextResponse.json(
        { error: 'تعذّر استخراج معرّف التغريدة من الرابط' },
        { status: 400 }
      )
    }

    // Normalize URL to x.com format for oEmbed
    const normalizedUrl = `https://x.com/i/status/${tweetId}`

    let tweetText: string | null = null
    let lastError = ''

    // 1) Try oEmbed API (primary)
    try {
      tweetText = await fetchViaOembed(normalizedUrl)
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : 'خطأ في oEmbed'
    }

    // 2) Fallback: syndication API
    if (!tweetText) {
      try {
        tweetText = await fetchViaSyndication(tweetId)
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : 'خطأ في syndication'
      }
    }

    if (!tweetText) {
      return NextResponse.json(
        {
          error: `تعذّر جلب التغريدة: ${lastError || 'لم يتم العثور على النص'}. تحقق من الرابط أو حاول لاحقاً.`,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ text: tweetText })
  } catch (err: unknown) {
    console.error('fetch-tweet error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ داخلي في الخادم' },
      { status: 500 }
    )
  }
}
