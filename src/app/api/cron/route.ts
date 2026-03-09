import { NextRequest, NextResponse } from 'next/server'
import { runScheduler } from '@/lib/scheduler'

// This endpoint can be called by an external cron service (e.g. Vercel Cron, cron-job.org)
// Add a secret to protect it: GET /api/cron?secret=YOUR_CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runScheduler()
    console.log('[Cron] Scheduler run result:', result)
    return NextResponse.json({ success: true, ...result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scheduler error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
