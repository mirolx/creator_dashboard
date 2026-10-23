import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadTrends } from '@/lib/trends/getTodayTrends'

/** 워크스페이스마다 YouTube API를 부르므로 넉넉히 둔다. */
export const maxDuration = 60

/** Vercel Cron이 매일 06:00 KST에 호출한다(vercel.json). 모든 YouTube 워크스페이스의 오늘 트렌드를 미리 가져온다. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('workspaces').select('id, user_id').eq('platform', 'youtube')
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // 오늘 트렌드가 이미 있는 워크스페이스는 loadTrends가 저장된 것을 그대로 돌려준다(API 호출 없음).
  const results: Record<string, string> = {}
  for (const { id, user_id } of data ?? []) {
    results[id] = (await loadTrends(supabase, { workspaceId: id, userId: user_id as string })).status
  }
  return Response.json({ results })
}
