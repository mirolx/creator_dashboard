# 벤치마킹 후보 보존 + 매일 자동 트렌드 설계

- 작성일: 2026-10-24
- 선행: 트렌드 다양성 개선 (`2026-10-01-trend-diversity-design.md`, `main`에 병합)
- 브랜치: `feat/trend-cron`
- 상태: 설계 승인됨 (A안)

## 1. 문제

1. **벤치마킹 섹션이 빈다.** 8개 채널의 최근 30일·3분 초과 영상 중 키워드가 맞는 영상은 14개뿐이고, 그중 8개가 최근 7일 안에 추천돼 빠진다. 게다가
   - `fetchChannelVideos`가 **최근 추천 제외보다 먼저** 채널당 2개 제한을 걸어, 상위 2개가 이미 본 영상인 채널은 안 본 영상이 남아 있어도 0개가 된다(버그).
   - "다시 가져오기"가 방금 보던 채널 영상까지 빼서 남은 후보가 바닥난다.
2. **자동 크롤링이 없다.** 트렌드는 그날 대시보드를 처음 열 때만 가져온다(DB에 방문한 날짜만 기록됨). 열지 않은 날은 비고, 첫 접속 때 몇 초 기다린다.

## 2. 설계

### ① 후보 정리 순서 — 새 `src/lib/trends/rankCandidates.ts` (기존 `excludeVideos.ts` 대체)

`rankCandidates({ channel, keyword, recent, groupOf })` → `{ channel, keyword }` (정렬된 후보 목록)

- **채널 후보**: 최근 추천 영상(`recent`)은 빼지 않고 **뒤로 미룬다** → 채널당 2개 제한(`capPerChannel`) → 안 본 영상·본 영상 각각 `diverseOrder`(관련도 3 이상만 새 주제로 앞당김) 후 이어 붙임. 채널 섹션은 후보가 있는 한 비지 않고, 안 본 영상이 먼저 나온다.
- **키워드 후보**: 최근 추천 영상은 **뺀다**(후보가 많음) → `diverseOrder`. 채널 후보도 없고 키워드가 모두 빠지면 빼지 않은 목록을 쓴다(빈 화면 방지).
- `capPerChannel`·`MAX_PER_CHANNEL`은 `fetchChannelVideos`에서 이 파일로 옮긴다. `fetchChannelVideos`는 정렬된 전체 후보를 돌려준다.
- `pickTrends`의 `groupOf` 옵션은 없앤다(다양성 정렬은 `rankCandidates`가 맡음). 소스별 4개·모자라면 다른 소스로 채움·중복 제거는 그대로.

### ② 매일 자동 트렌드 — Vercel Cron

- `vercel.json`: `{ "crons": [{ "path": "/api/cron/trends", "schedule": "0 21 * * *" }] }` → 매일 UTC 21시 = **한국 시간 오전 6시**(Hobby 플랜은 하루 1회, 그 시간대 안에서 실행).
- `src/app/api/cron/trends/route.ts` `GET`:
  - `Authorization: Bearer ${CRON_SECRET}`가 아니면(또는 `CRON_SECRET` 미설정) 401.
  - 서비스 롤 클라이언트로 `platform = 'youtube'`인 모든 워크스페이스를 차례로 `loadTrends` 처리. 이미 오늘 트렌드가 있으면 건너뛴다(기존 동작). 결과 `{ results: { [workspaceId]: status } }`.
  - `maxDuration = 60`.
- `src/lib/supabase/admin.ts` `createAdminClient()`: `SUPABASE_SERVICE_ROLE_KEY`로 만든 RLS 우회 클라이언트(세션 저장·갱신 끔). 키가 없으면 오류. 크론 라우트에서만 쓴다.
- `getTodayTrends.ts`: 본문을 `loadTrends(supabase, workspaceId, { exclude })`로 분리. `getTodayTrends`는 `requireUser()` + 쿠키 클라이언트로 `loadTrends`를 부르는 얇은 래퍼. 대시보드 첫 접속 시 가져오기는 크론이 실패한 날의 안전망으로 그대로 둔다.
- `src/lib/auth/paths.ts`: `/api/cron`을 공개 경로에 추가(로그인 리다이렉트 방지, 보호는 `CRON_SECRET`이 맡음).
- 환경변수(사용자가 Vercel에 직접 입력): `SUPABASE_SERVICE_ROLE_KEY`(Sensitive), `CRON_SECRET`(16자 이상 임의 문자열). `.env.example`·README에 이름만 추가.

## 3. 비용

워크스페이스(YouTube) 1개 기준 하루 1회 ≈ 430 units — 지금 첫 접속 시와 같다. 크론이 먼저 가져오면 첫 접속 때는 호출하지 않는다.

## 4. 테스트

- `rankCandidates`: 본 채널 영상은 뒤로(빠지지 않음), 채널당 2개 제한이 미룬 뒤에 적용, 안 본 영상끼리 다양성 정렬, 키워드는 최근 영상 제외, 모두 빠지면 원래 키워드 목록.
- `fetchChannelVideos`: 채널당 제한 없이 전체 정렬 결과.
- `isPublicPath('/api/cron/trends')` true.
- 크론 라우트: 로컬에서 비밀값 없이 호출 시 401 확인. 실제 실행은 배포 후 Vercel 대시보드의 Cron Jobs → Run으로 확인.
- 기존 테스트, typecheck, lint, build 통과.
