# 벤치마킹 후보 보존 + 매일 자동 트렌드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 벤치마킹 섹션이 최근 추천 제외 때문에 비지 않게 하고, Vercel Cron으로 매일 오전 6시(KST)에 트렌드를 미리 가져온다.

**Architecture:** 후보 정렬을 순수 함수 `rankCandidates`로 모으고, `getTodayTrends` 본문을 클라이언트를 주입받는 `loadTrends`로 분리해 크론 라우트(서비스 롤 클라이언트)와 대시보드(쿠키 클라이언트)가 같이 쓴다.

**Tech Stack:** Next.js 16 Route Handler, Supabase (`@supabase/supabase-js`), Vercel Cron, Vitest

**Spec:** `docs/superpowers/specs/2026-10-24-trend-cron-design.md`

## Global Constraints

- 크론 스케줄 `0 21 * * *` (UTC) = 06:00 KST. 인증은 `Authorization: Bearer ${CRON_SECRET}`.
- 비밀값(`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`)은 코드·커밋에 넣지 않는다. `.env.example`에는 이름만.
- YouTube 호출 수 증가 없음, DB 마이그레이션 없음, UI 변경 없음.

---

### Task 1: `rankCandidates` — 채널은 미루고 키워드는 뺀다

**Files:** Create `src/lib/trends/rankCandidates.ts`, `src/lib/trends/rankCandidates.test.ts` · Delete `src/lib/trends/excludeVideos.ts`, `excludeVideos.test.ts` · Modify `src/lib/youtube/fetchChannelVideos.ts`(+test), `src/lib/trends/pickTrends.ts`(+test)

**Interfaces (Produces):**
- `capPerChannel<T extends { channelId: string }>(list: T[], max = MAX_PER_CHANNEL): T[]`, `MAX_PER_CHANNEL = 2`
- `rankCandidates<T extends ScoredVideo>({ channel, keyword, recent, groupOf }: { channel: T[]; keyword: T[]; recent: Iterable<string>; groupOf: (keyword: string) => string }): { channel: T[]; keyword: T[] }`
- `pickTrends(channel, keyword, { perSource?, total? })` — `groupOf` 옵션 제거

- [ ] 테스트 작성 (`rankCandidates.test.ts`):
  - 본 채널 영상은 빠지지 않고 안 본 영상 뒤로 간다
  - 채널당 2개 제한은 미룬 뒤 적용 (상위 2개가 본 영상인 채널도 안 본 영상이 남음)
  - 안 본 채널 영상끼리 주제 다양성 정렬 (관련도 3 이상만 앞당김)
  - 키워드 후보는 최근 영상 제외 + 다양성 정렬
  - 채널 후보가 없고 키워드가 모두 빠지면 원래 키워드 목록
- [ ] 실패 확인 → 구현:

```ts
export function capPerChannel<T extends { channelId: string }>(list: T[], max = MAX_PER_CHANNEL): T[] {
  const perChannel = new Map<string, number>()
  return list.filter((v) => {
    const count = perChannel.get(v.channelId) ?? 0
    if (count >= max) return false
    perChannel.set(v.channelId, count + 1)
    return true
  })
}

export function rankCandidates<T extends ScoredVideo>({ channel, keyword, recent, groupOf }) {
  const seen = new Set(recent)
  const isSeen = (v: T) => seen.has(v.videoId)
  const order = (list: T[]) => diverseOrder(list, groupOf, MIN_PROMOTE_RELEVANCE)
  const capped = capPerChannel([...channel.filter((v) => !isSeen(v)), ...channel.filter(isSeen)])
  const freshKeyword = keyword.filter((v) => !isSeen(v))
  return {
    channel: [...order(capped.filter((v) => !isSeen(v))), ...order(capped.filter(isSeen))],
    keyword: order(freshKeyword.length > 0 || capped.length > 0 ? freshKeyword : keyword),
  }
}
```

- [ ] `fetchChannelVideos`에서 채널당 제한·`MAX_PER_CHANNEL` 제거(정렬된 전체 반환), 기존 "at most 2 per channel"/"applies the per-channel cap" 테스트 기대값을 제한 없는 결과로 수정.
- [ ] `pickTrends`에서 `groupOf` 옵션과 재배열 제거, "pickTrends with groupOf" 테스트는 `rankCandidates` 테스트로 대체.
- [ ] `excludeVideos.ts`(+test) 삭제. `npx vitest run` 통과 → 커밋 `fix(trends): keep benchmark candidates by deferring recently shown videos`

### Task 2: `loadTrends` 분리 + 크론 라우트

**Files:** Modify `src/lib/trends/getTodayTrends.ts`, `src/lib/auth/paths.ts`(+test), `.env.example`, `README.md` · Create `src/lib/supabase/admin.ts`, `src/app/api/cron/trends/route.ts`, `vercel.json`

**Interfaces:**
- Consumes: `rankCandidates` (Task 1)
- Produces: `loadTrends(supabase: SupabaseClient, workspaceId: string, { exclude?: string[] } = {}): Promise<TrendsResult>`, `createAdminClient(): SupabaseClient`

- [ ] `isPublicPath('/api/cron/trends')`가 true인 테스트 추가 → 실패 확인 → `PUBLIC_PATHS`에 `'/api/cron'` 추가.
- [ ] `getTodayTrends.ts`: 본문을 `loadTrends(supabase, workspaceId, opts)`로 옮기고, `getTodayTrends = requireUser() + loadTrends(await createClient(), ...)`. 후보 처리는 `const ranked = rankCandidates({ channel: channelVideos, keyword: keywordVideos, recent: [...exclude, ...recentIds], groupOf })` → `pickTrends(ranked.channel, ranked.keyword)`.
- [ ] `admin.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

/** 서비스 롤 클라이언트 — RLS를 우회한다. 크론처럼 로그인 없이 도는 서버 코드에서만 쓴다. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
```

- [ ] `route.ts`:

```ts
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadTrends } from '@/lib/trends/getTodayTrends'

/** 워크스페이스마다 YouTube API를 부르므로 넉넉히 둔다. */
export const maxDuration = 60

/** Vercel Cron이 매일 06:00 KST에 호출한다. 모든 YouTube 워크스페이스의 오늘 트렌드를 미리 가져온다. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('workspaces').select('id').eq('platform', 'youtube')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  const results: Record<string, string> = {}
  for (const { id } of data ?? []) results[id] = (await loadTrends(supabase, id)).status
  return Response.json({ results })
}
```

- [ ] `vercel.json`: `{ "crons": [{ "path": "/api/cron/trends", "schedule": "0 21 * * *" }] }`
- [ ] `.env.example`에 `SUPABASE_SERVICE_ROLE_KEY=`, `CRON_SECRET=` 추가. README(한/영) 환경변수 표·Vercel 배포 단계·기능 설명에 매일 06:00 자동 갱신 추가.
- [ ] `npx vitest run && npm run typecheck && npm run lint && npm run build` → 로컬 `curl localhost:3000/api/cron/trends` 가 401인지 확인 → 커밋 `feat(trends): fetch trends daily with Vercel Cron`
