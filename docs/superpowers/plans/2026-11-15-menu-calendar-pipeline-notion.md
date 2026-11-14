# 메뉴 분리 · 캘린더 · 파이프라인 · Notion 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한 페이지 대시보드를 홈·캘린더·파이프라인·탐색·보관함·설정 메뉴로 나눈다. 날짜를 가진 5단계 파이프라인 카드, 월간 캘린더, 보관함, 노션 '콘텐츠' DB로 페이지를 만들고 내용을 반영하는 기능을 더한다.

**Architecture:** `kanban_cards`에 단계·날짜·노션 ID·보관 시각 컬럼을 추가하고, 캘린더·파이프라인·보관함·홈이 모두 이 테이블을 `useLiveList`로 공유한다. 노션 호출은 서버 전용 모듈과 Server Action에서만 한다. 대시보드 저장이 성공한 뒤에 노션에 반영한다(한 방향).

**Tech Stack:** Next.js 16.3 (App Router, Server Actions), React 19, Supabase(RLS + Realtime), next-intl, Tailwind 4, zod, vitest. Notion REST API는 `fetch`로 직접 호출한다(SDK를 쓰지 않는다).

**Spec:** `docs/superpowers/specs/2026-11-15-menu-calendar-pipeline-notion-design.md`

## Global Constraints

- 코드를 쓰기 전에 `node_modules/next/dist/docs/`에서 라우팅·Server Actions 문서를 확인한다(AGENTS.md: "This is NOT the Next.js you know").
- 단계 키와 순서: `idea`, `shoot`, `edit`, `scheduled`, `published`. 화면에는 아이디어 / 촬영 / 편집 / 예약 업로드 / 게시 완료로 보인다.
- 노션 상태 매핑: idea→`아이디어`, shoot→`촬영 예정`, edit→`편집 중`, scheduled→`예약 업로드`, published→`게시 완료`.
- 노션 속성 이름: `제목`(title), `상태`(select), `촬영일`, `편집 마감일`, `업로드일`(date, 날짜만).
- 환경변수: `NOTION_TOKEN`, `NOTION_DATA_SOURCE_ID`(값 `8818195e-fee9-4942-b7a4-a18d9b53adfe`). 서버에서만 읽는다.
- 날짜는 한국 시간 기준 `YYYY-MM-DD`이다(`seoulDateString`). 캘린더는 월요일부터 시작한다.
- 노션이 실패해도 대시보드 저장은 막지 않는다. 노션 토큰이 클라이언트 번들에 들어가면 안 된다.
- 기존 데이터는 지우지 않는다. `reference_items`, `hashtags` 테이블도 그대로 둔다.
- 화면 문구는 `messages/ko.json`과 `en.json` 양쪽에 같은 키로 넣는다(`src/i18n/messages.test.ts`가 확인한다).
- 위젯은 기존 패턴을 따른다: `useLiveList` + `tableData` 낙관적 쓰기, `Card`·`pillClass`·`fieldClass` 디자인 토큰.
- 작업은 `main`이 아닌 `feat/pipeline-calendar` 브랜치에서 한다.

## Review Focus

1. **노션 버튼을 빠르게 두 번 누름** → 페이지가 두 개 생기면 안 된다. 진행 중에는 버튼을 비활성화하고, 서버도 이미 `notion_page_id`가 있으면 새로 만들지 않는다(Task 4).
2. **토큰 없음 / DB에 통합 미연결** → 버튼을 누르면 원인을 알려 주는 문구가 나와야 한다. 화면이 깨지거나 무반응이면 안 된다(Task 3, 4 테스트).
3. **날짜를 지운 카드(null)의 노션 반영** → 노션 날짜도 비워야 한다. 예전 값이 남으면 안 된다(Task 3 테스트).
4. **월 경계와 시간대** → 일요일로 끝나는 달, 2월, 한국 시간 자정 무렵의 기타 일정을 옮겨도 날짜가 하루 밀리면 안 된다(Task 7 테스트).
5. **보관한 카드** → 파이프라인과 홈 카운트에는 안 보이고, 캘린더에는 흐리게 보이고, 되돌리면 '게시 완료' 칸 맨 아래로 와야 한다(Task 5, 6 테스트).

---

### Task 1: 레퍼런스·해시태그 기능 제거

**Files:**
- Delete: `src/features/references/`, `src/features/hashtags/`
- Modify: `src/app/(app)/[platform]/page.tsx`, `src/lib/dashboard.ts`, `src/lib/types.ts`, `src/lib/validation.ts`(`normalizeTag`가 해시태그 전용이면 삭제), `src/lib/validation.test.ts`, `messages/ko.json`, `messages/en.json`

**Interfaces:**
- Produces: `WORKSPACE_TABLES`에서 `reference_items`와 `hashtags`가 빠진다. `REFERENCE_KINDS`, `ReferenceItem`, `Hashtag` 타입이 없어진다.

- [ ] **Step 1:** 두 폴더를 지운다. 대시보드 페이지에서 두 위젯을 빼고, `loadDashboard`, `types.ts`, 메시지의 `references`·`hashtags` 키를 지운다. `normalizeTag`를 다른 곳에서 쓰지 않으면(`grep -rn normalizeTag src`) 테스트와 함께 지운다.
- [ ] **Step 2:** 확인한다. Run: `npm test && npm run typecheck && npm run lint`. Expected: 모두 통과.
- [ ] **Step 3:** Commit: `chore: remove references and hashtag bank widgets`

### Task 2: 파이프라인 데이터 모델 (마이그레이션 + 타입 + 도메인 함수)

**Files:**
- Create: `supabase/migrations/0005_pipeline_calendar.sql`, `src/lib/pipeline.ts`, `src/lib/pipeline.test.ts`
- Modify: `src/lib/types.ts`, `src/features/kanban/KanbanWidget.tsx`(새 카드 기본 단계를 `'idea'`로 바꿔서 컴파일만 유지), `messages/*.json`(`kanban.statuses`를 새 키 5개로 교체)

**Interfaces:**
- Produces (`types.ts`):
  - `KANBAN_STATUSES = ['idea','shoot','edit','scheduled','published'] as const`
  - `CARD_DATE_FIELDS = ['shoot_on','edit_due_on','upload_on'] as const`, `type CardDateField`
  - `KanbanCard`에 `notion_page_id: string | null`, `shoot_on`, `edit_due_on`, `upload_on: string | null`(YYYY-MM-DD), `archived_at: string | null` 추가
- Produces (`pipeline.ts`):
  - `NOTION_STATUS: Record<KanbanStatus, string>`
  - `isActive(card: KanbanCard): boolean` — `archived_at === null`
  - `positionAt(sorted: number[], index: number): number` — 정렬된 칸에서 `index` 자리에 끼울 position. `positionBetween(sorted[index-1], sorted[index])`를 쓴다.
  - `nextDue(card: KanbanCard, today: string): { field: CardDateField; date: string; days: number } | null` — 오늘 이후(오늘 포함) 날짜 중 가장 가까운 것. 없으면 null.

- [ ] **Step 1: 마이그레이션 작성.** 파일 상단 주석 형식은 0004와 같게 한다("0004 다음에 한 번 실행, 새 코드를 배포하기 전에"). 한 트랜잭션 안에서 다음을 한다.
  1. 기존 status check 제약을 지운다. 이름은 `kanban_cards_status_check`이고, 확신이 없으면 `pg_constraint`에서 찾아 지우는 `do` 블록을 쓴다.
  2. 값을 옮긴다: `update ... set status = case status when 'shot' then 'shoot' when 'editing' then 'edit' when 'review' then 'edit' when 'uploaded' then 'published' else status end`
  3. 새 check 제약 `status in ('idea','shoot','edit','scheduled','published')`를 건다.
  4. `add column notion_page_id text`, `shoot_on date`, `edit_due_on date`, `upload_on date`, `archived_at timestamptz`를 추가한다.
- [ ] **Step 2: 실패하는 테스트 작성** (`src/lib/pipeline.test.ts`)

```ts
it('maps every status to a Notion option', () => {
  expect(NOTION_STATUS).toEqual({ idea: '아이디어', shoot: '촬영 예정', edit: '편집 중', scheduled: '예약 업로드', published: '게시 완료' })
})
it('positionAt inserts between neighbours, at start and at end', () => {
  expect(positionAt([1, 2, 3], 1)).toBe(1.5)
  expect(positionAt([1, 2], 0)).toBe(0)
  expect(positionAt([1, 2], 2)).toBe(3)
  expect(positionAt([], 0)).toBe(1)
})
it('nextDue picks the nearest date on or after today', () => {
  const c = card({ shoot_on: '2026-11-10', edit_due_on: '2026-11-15', upload_on: '2026-11-20' })
  expect(nextDue(c, '2026-11-15')).toEqual({ field: 'edit_due_on', date: '2026-11-15', days: 0 })
  expect(nextDue(c, '2026-11-21')).toBeNull()
})
it('isActive is false once archived', () => {
  expect(isActive(card({ archived_at: '2026-11-15T00:00:00Z' }))).toBe(false)
})
```
(`card()`는 테스트 파일 안에서 기본 `KanbanCard`를 만드는 헬퍼다.)
- [ ] **Step 3:** Run: `npx vitest run src/lib/pipeline.test.ts`. Expected: FAIL(모듈 없음).
- [ ] **Step 4:** `types.ts`와 `pipeline.ts`를 구현하고, `KanbanWidget`의 기본 단계와 메시지 키를 맞춘다.
- [ ] **Step 5:** Run: `npm test && npm run typecheck`. Expected: PASS.
- [ ] **Step 6:** Commit: `feat(pipeline): five-stage status, card dates and archive columns`

### Task 3: Notion 클라이언트 (서버 전용)

**Files:**
- Create: `src/lib/notion/properties.ts`, `src/lib/notion/properties.test.ts`, `src/lib/notion/client.ts`, `src/lib/notion/client.test.ts`
- Modify: `.env.example`(`NOTION_TOKEN=`, `NOTION_DATA_SOURCE_ID=` 추가, 주석 한 줄)

**Interfaces:**
- Consumes: `NOTION_STATUS`, `KanbanCard`(Task 2)
- Produces:
  - `cardToNotionProperties(card: Pick<KanbanCard,'title'|'status'|'shoot_on'|'edit_due_on'|'upload_on'>): Record<string, unknown>`
  - `notionPageIdFromUrl(url: string): string | null` — 경로 끝의 32자리 hex(대시 포함 가능)를 대시 있는 UUID로 바꾼다.
  - `type NotionErrorCode = 'missing-config' | 'unauthorized' | 'not-found' | 'failed'`
  - `class NotionError extends Error { code: NotionErrorCode }`
  - `createNotionPage(properties): Promise<{ id: string; url: string }>`
  - `updateNotionPage(pageId: string, properties): Promise<void>`

- [ ] **Step 1: 실패하는 테스트 작성.**

```ts
// properties.test.ts
expect(cardToNotionProperties({ title: '브이로그', status: 'shoot', shoot_on: '2026-11-20', edit_due_on: null, upload_on: null })).toEqual({
  제목: { title: [{ text: { content: '브이로그' } }] },
  상태: { select: { name: '촬영 예정' } },
  촬영일: { date: { start: '2026-11-20' } },
  '편집 마감일': { date: null },
  업로드일: { date: null },
})
expect(notionPageIdFromUrl('https://www.notion.so/My-Page-0123456789abcdef0123456789abcdef')).toBe('01234567-89ab-cdef-0123-456789abcdef')
expect(notionPageIdFromUrl('https://app.notion.com/p/0123456789abcdef0123456789abcdef?v=1')).toBe('01234567-89ab-cdef-0123-456789abcdef')
expect(notionPageIdFromUrl('https://www.notion.so/')).toBeNull()
```

```ts
// client.test.ts — vi.stubGlobal('fetch', ...) 와 vi.stubEnv 사용
it('creates the page under the data source', ...)
  // POST https://api.notion.com/v1/pages
  // headers: Authorization: Bearer <token>, Notion-Version: 2025-09-03
  // body.parent = { type: 'data_source_id', data_source_id: <env> }
  // 반환값 { id, url }
it('throws missing-config when NOTION_TOKEN is empty', ...)  // fetch를 호출하지 않는다
it('maps 401 to unauthorized and 404 to not-found', ...)
it('updates with PATCH /v1/pages/:id', ...)
```
- [ ] **Step 2:** Run: `npx vitest run src/lib/notion`. Expected: FAIL.
- [ ] **Step 3:** 구현한다. `client.ts` 첫 줄에 `import 'server-only'`를 넣는다(없으면 설치하지 말고, 이 파일을 Server Action에서만 import하는 것으로 대신한다. 패키지가 있는지 먼저 확인). 응답이 403이면 `unauthorized`로 본다. 통합이 DB에 연결되지 않았을 때 Notion은 404를 준다.
- [ ] **Step 4:** Run: `npx vitest run src/lib/notion`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(notion): server-side client for the content database`

### Task 4: Notion Server Actions + 클라이언트 동기화 훅

**Files:**
- Create: `src/features/pipeline/notionActions.ts`, `src/features/pipeline/useNotionSync.ts`, `src/features/pipeline/NotionButton.tsx`
- Modify: `messages/*.json`(`pipeline.notion.*`: open, creating, failed, retry, missingConfig, unauthorized, notFound)

**Interfaces:**
- Consumes: Task 3 전체, `requireUser`, 서버 `createClient`
- Produces:
  - `openNotionPage(cardId: string): Promise<{ url: string } | { error: NotionErrorCode | 'invalid' }>`
  - `syncNotionPage(cardId: string): Promise<ActionResult>` — 연결된 페이지가 없으면 `{ ok: true }`이고 아무것도 하지 않는다.
  - `useNotionSync(): { schedule(cardId: string): void; failed: Set<string>; retry(cardId: string): void }` — 카드별로 1000ms 디바운스한다.
  - `<NotionButton card={KanbanCard} />`

- [ ] **Step 1: `openNotionPage`를 구현한다.** 순서:
  1. `z.uuid()`로 `cardId`를 검사하고 `requireUser()`를 부른다.
  2. RLS 클라이언트로 카드를 읽는다. 없으면 `{ error: 'invalid' }`.
  3. `notion_page_id`가 있으면 `{ url: notion_url }`을 돌려준다.
  4. `notion_url`만 있으면 `notionPageIdFromUrl`로 ID를 꺼낸다. 성공하면 `notion_page_id`를 저장하고 그 URL을 돌려준다. 실패하면 링크만 돌려준다.
  5. 둘 다 없으면 `createNotionPage` 후 `notion_page_id`·`notion_url`을 저장한다. 이때 `.is('notion_page_id', null)` 조건으로 update해서 동시에 두 번 눌러도 먼저 저장된 값만 남게 한다.
  - `NotionError`는 `{ error: code }`로 바꾼다.
- [ ] **Step 2: `syncNotionPage`를 구현한다.** 카드를 읽고 `notion_page_id`가 있으면 `updateNotionPage`를 부른다. 실패하면 `{ error: code }`.
- [ ] **Step 3: `NotionButton`을 구현한다.** 클릭 즉시 `const tab = window.open('', '_blank')`로 빈 탭을 연다. 액션 결과가 오면 `tab.location.href = url`로 주소를 넣고, 오류면 `tab.close()` 후 오류 문구를 보여준다. 진행 중에는 `disabled`. 연결된 카드면 'Notion' 라벨, 없으면 '+ Notion' 라벨.
- [ ] **Step 4:** 확인한다. Run: `npm run typecheck && npm run lint && npm run build`. Expected: 통과. 빌드 결과물에 토큰이 없는지도 확인한다: `grep -r NOTION_TOKEN .next/static`의 결과가 비어야 한다.
- [ ] **Step 5:** Commit: `feat(notion): create/open and sync pages from pipeline cards`

### Task 5: 메뉴와 라우트 분리 (홈·탐색·설정)

**Files:**
- Create: `src/app/(app)/MenuTabs.tsx`, `src/app/(app)/[platform]/explore/page.tsx`
- Modify: `src/app/(app)/layout.tsx`, `src/app/(app)/WorkspaceTabs.tsx`, `src/lib/platform.ts`, `src/lib/platform.test.ts`, `src/lib/dashboard.ts`, `src/app/(app)/[platform]/page.tsx`, `messages/*.json`(`nav.home`, `calendar`, `pipeline`, `explore`, `archive`), `src/features/trends/actions.ts`(`revalidatePath('/youtube/explore')`도 추가)

**Interfaces:**
- Produces:
  - `SECTIONS = ['', 'calendar', 'pipeline', 'explore', 'archive', 'settings'] as const`, `type Section`
  - `sectionFromPath(pathname: string): Section` — `/youtube` → `''`, `/youtube/calendar` → `'calendar'`. 모르는 값이면 `''`.
  - `listRows<T>(workspaceId: string, table: WorkspaceTable): Promise<T[]>`(`dashboard.ts`, `loadDashboard`를 대신한다)

- [ ] **Step 1: 실패하는 테스트 작성** (`platform.test.ts`)

```ts
expect(sectionFromPath('/youtube')).toBe('')
expect(sectionFromPath('/instagram/calendar')).toBe('calendar')
expect(sectionFromPath('/youtube/settings')).toBe('settings')
expect(sectionFromPath('/youtube/unknown')).toBe('')
```
- [ ] **Step 2:** Run: `npx vitest run src/lib/platform.test.ts`. Expected: FAIL.
- [ ] **Step 3:** 구현한다.
  - `WorkspaceTabs`(플랫폼 탭)은 현재 섹션을 유지한 채 플랫폼만 바꾸고, 설정 탭은 뺀다.
  - `MenuTabs`는 `SECTIONS`로 6개 탭을 만들고 `PillTabs`를 재사용한다.
  - 레이아웃 헤더는 첫 줄이 플랫폼 탭 + 로그아웃, 둘째 줄이 메뉴 탭이다.
  - 탐색 페이지로 트렌드(유튜브만), 아이디어, 메모 위젯을 옮긴다.
  - 홈은 이 단계에서 일정, 체크리스트, 성과 카드만 남긴다. 요약은 Task 8에서 만든다.
  - 칸반 위젯은 Task 6에서 파이프라인 페이지로 옮겨지므로, 이 단계에서는 홈에서 뺀다.
- [ ] **Step 4:** Run: `npm test && npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5:** dev 서버에서 메뉴 6개 이동과 플랫폼 전환 시 섹션이 유지되는지 확인한다.
- [ ] **Step 6:** Commit: `feat(nav): split dashboard into section menu pages`

### Task 6: 파이프라인 보드 + 보관함 페이지

**Files:**
- Create: `src/app/(app)/[platform]/pipeline/page.tsx`, `src/app/(app)/[platform]/archive/page.tsx`, `src/features/pipeline/PipelineBoard.tsx`, `src/features/pipeline/PipelineCard.tsx`, `src/features/pipeline/ArchiveList.tsx`, `src/features/pipeline/data.ts`(`kanbanData`를 여기로 옮김), `src/lib/archive.ts`, `src/lib/archive.test.ts`
- Delete: `src/features/kanban/`
- Modify: `messages/*.json`(`kanban` 네임스페이스를 `pipeline`으로 바꿈: title, cardLabel, emptyColumn, dropHere, stage, dates.*, archive, unarchive, deleteConfirm, archiveTitle, archiveEmpty, notionSyncFailed)

**Interfaces:**
- Consumes: Task 2(`isActive`, `positionAt`, `nextDue`, `CARD_DATE_FIELDS`), Task 4(`NotionButton`, `useNotionSync`)
- Produces:
  - `sortArchived(cards: KanbanCard[]): KanbanCard[]` — 업로드일 최신순, 업로드일이 없으면 `archived_at` 최신순, 업로드일 있는 카드가 먼저
  - `unarchivePatch(cards: KanbanCard[]): Pick<KanbanCard,'archived_at'|'status'|'position'>` — `{ archived_at: null, status: 'published', position: <활성 published 카드 끝> }`

- [ ] **Step 1: 실패하는 테스트 작성** (`archive.test.ts`)

```ts
it('sorts by upload date desc, undated last by archived_at desc', ...)
it('unarchive goes to the end of active published cards', () => {
  const cards = [card({ status: 'published', position: 3 }), card({ status: 'published', position: 9, archived_at: 'x' })]
  expect(unarchivePatch(cards)).toEqual({ archived_at: null, status: 'published', position: 4 })
})
```
- [ ] **Step 2:** Run: `npx vitest run src/lib/archive.test.ts`. Expected: FAIL.
- [ ] **Step 3:** `archive.ts`를 구현하고 테스트를 통과시킨다.
- [ ] **Step 4: `PipelineBoard`를 구현한다.**
  - `useLiveList('kanban_cards', initial, byPosition)`로 받은 목록을 `isActive`로 거른다.
  - 5개 칸을 가로로 놓고, 좁은 화면에서는 `overflow-x-auto`.
  - 새 카드는 `idea` 칸 끝에 들어간다.
  - HTML5 드래그:
    - `dataTransfer`에 카드 id를 담는다.
    - 칸이나 카드 위에 드롭하면 그 자리 index를 계산해 `positionAt`으로 position을 정한다.
    - `status`와 `position`을 한 번에 update한다.
  - 카드 저장이 성공하고 제목·단계·날짜가 바뀌었으면 `useNotionSync().schedule(id)`를 부른다. 실패 표시가 있는 카드에는 '노션 반영 실패 · 다시 시도' 버튼을 보여준다.
- [ ] **Step 5: `PipelineCard`를 구현한다.**
  - 기본으로 보이는 것: 제목(`EditableText`), `nextDue` 배지('업로드 D-3' 형식), 단계 `<select>`, `NotionButton`, 펼치기 버튼.
  - 펼치면 날짜 입력 3개(`type="date"`, 비우면 null)와 삭제 버튼이 나온다.
  - `published` 단계 카드에만 '보관함으로' 버튼이 있고, 누르면 `archived_at: new Date().toISOString()`.
- [ ] **Step 6: 보관함을 구현한다.** `ArchiveList`는 보관한 카드를 `sortArchived` 순서로 보여준다. 행마다 제목, 업로드일, `NotionButton`, 되돌리기(`unarchivePatch`), 삭제(`window.confirm` 후)가 있다.
- [ ] **Step 7:** Run: `npm test && npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 8:** dev 서버에서 확인한다.
  - 드래그 이동과 드롭다운 이동
  - 날짜 저장
  - 보관 → 파이프라인에서 사라지고 보관함에 보이는지
  - 되돌리기 → '게시 완료' 칸 맨 아래로 오는지
  - 노션 버튼: 생성 → 열기 → 다시 누르면 같은 페이지
  - 단계를 바꾸면 노션 '상태'에 반영되는지
- [ ] **Step 9:** Commit: `feat(pipeline): five-stage board with dates, archive and Notion button`

### Task 7: 캘린더

**Files:**
- Create: `src/lib/calendar.ts`, `src/lib/calendar.test.ts`, `src/app/(app)/[platform]/calendar/page.tsx`, `src/features/calendar/CalendarView.tsx`, `src/features/calendar/DayCell.tsx`, `src/features/calendar/CardDatePopover.tsx`
- Modify: `messages/*.json`(`calendar.*`: title, prev, next, today, add, undated, kinds.shoot/edit/upload/event, openPipeline, hint)

**Interfaces:**
- Consumes: `KanbanCard`, `ScheduleItem`, `CARD_DATE_FIELDS`, `seoulDateString`, `useNotionSync`(Task 4)
- Produces:
  - `monthGrid(year: number, month: number): string[]` — month는 1–12. 월요일에 시작하는 주 단위 날짜 목록이다. 앞뒤 달 날짜를 채워 길이는 7의 배수(35 또는 42).
  - `type CalendarBlock = { key: string; date: string; kind: 'shoot' | 'edit' | 'upload' | 'event'; title: string; archived: boolean; source: { type: 'card'; id: string; field: CardDateField } | { type: 'schedule'; id: string } }`
  - `toCalendarBlocks(cards: KanbanCard[], items: ScheduleItem[]): CalendarBlock[]` — 기타 일정의 날짜는 `seoulDateString(new Date(scheduled_at))`
  - `moveScheduledAt(iso: string, date: string): string` — 한국 시간 시각은 유지하고 날짜만 바꾼 UTC ISO 문자열

- [ ] **Step 1: 실패하는 테스트 작성** (`calendar.test.ts`)

```ts
expect(monthGrid(2026, 11)[0]).toBe('2026-10-26')          // 11/1은 일요일 → 앞 월요일부터
expect(monthGrid(2026, 11).at(-1)).toBe('2026-12-06')
expect(monthGrid(2026, 11)).toHaveLength(42)
expect(monthGrid(2026, 2)[0]).toBe('2026-01-26')            // 2026-02-01은 일요일
expect(monthGrid(2026, 2)).toHaveLength(35)                 // 1/26 ~ 3/1
it('makes one block per filled card date and marks archived', ...)
it('dates schedule items in Seoul time', () => {
  // 2026-11-15T15:30:00Z 는 서울 16일 00:30
  expect(toCalendarBlocks([], [item({ scheduled_at: '2026-11-15T15:30:00Z' })])[0].date).toBe('2026-11-16')
})
expect(moveScheduledAt('2026-11-15T15:30:00Z', '2026-11-20')).toBe('2026-11-19T15:30:00.000Z')
```
- [ ] **Step 2:** Run: `npx vitest run src/lib/calendar.test.ts`. Expected: FAIL.
- [ ] **Step 3:** `calendar.ts`를 구현하고 테스트를 통과시킨다.
- [ ] **Step 4: `CalendarView`를 구현한다.**
  - 데이터: `kanban_cards`와 `schedule_items` 두 개의 `useLiveList`.
  - 이전 / 다음 / 오늘 버튼이 있고, 화면 상단 안내 문구는 `calendar.hint`이다.
  - 블록 이동은 두 방법을 모두 지원한다.
    - 드래그해서 다른 날짜 칸에 놓기
    - 블록을 눌러 고른 뒤 날짜 칸 누르기
  - 이동 결과:
    - 카드 블록이면 그 `field`를 새 날짜로 update하고, 노션 동기화를 예약한다.
    - 기타 일정 블록이면 `scheduled_at = moveScheduledAt(...)`.
  - 보관한 카드 블록은 `opacity-50`.
  - 날짜 칸의 + 버튼은 기타 일정 추가 폼(제목 + 종류 + 시각)을 연다. 시각은 그 날짜의 한국 시간 10:00을 기본값으로 한다.
  - 카드 블록을 누르면 `CardDatePopover`가 열린다. 세 날짜를 고칠 수 있고 `/[platform]/pipeline` 링크가 있다.
  - 그리드 아래에 '날짜 없는 카드' 목록(활성 카드 중 세 날짜가 모두 null)을 둔다. 여기서 날짜 칸으로 끌면 `upload_on`이 그 날짜가 된다.
- [ ] **Step 5:** Run: `npm test && npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 6:** dev 서버에서 확인한다: 월 이동, 블록 드래그와 탭 이동, 날짜 없는 카드 배치, 기타 일정 추가, 노션 업로드일 반영.
- [ ] **Step 7:** Commit: `feat(calendar): month view of card dates and events`

### Task 8: 홈 요약

**Files:**
- Create: `src/features/home/StageSummary.tsx`, `src/features/home/WeekAgenda.tsx`
- Modify: `src/app/(app)/[platform]/page.tsx`, `src/lib/calendar.ts` + 테스트(`weekDates(today: string): string[]` 추가 — 오늘부터 7일), `messages/*.json`(`home.*`)

**Interfaces:**
- Consumes: `toCalendarBlocks`, `isActive`, `KANBAN_STATUSES`

- [ ] **Step 1: 실패하는 테스트 작성.** `expect(weekDates('2026-11-30')).toEqual(['2026-11-30','2026-12-01', ... ,'2026-12-06'])`
- [ ] **Step 2:** 구현한다.
  - `WeekAgenda`는 오늘부터 7일 동안의 블록을 날짜별로 보여준다. 기존 `ScheduleWidget`을 대신한다.
  - `StageSummary`는 활성 카드의 단계별 개수를 보여주고, 누르면 `/[platform]/pipeline`으로 간다.
  - 홈 구성: `WeekAgenda`, `ChecklistWidget`, `StageSummary`, 성과 카드.
  - 다른 곳에서 쓰지 않으면 `ScheduleWidget`을 지운다(`src/features/schedule/data.ts`는 캘린더가 쓰므로 남긴다).
- [ ] **Step 3:** Run: `npm test && npm run typecheck && npm run lint && npm run build`. Expected: PASS.
- [ ] **Step 4:** Commit: `feat(home): week agenda and pipeline stage summary`

### Task 9: 문서와 최종 확인

**Files:**
- Modify: `README.md`(Notion 설정 4단계와 마이그레이션 0005 실행 순서, 스펙 5-7절 내용)

- [ ] **Step 1:** README에 스펙 5-7절의 사용자 할 일을 옮긴다.
- [ ] **Step 2:** Run: `npm test && npm run typecheck && npm run lint && npm run build`. Expected: 모두 통과.
- [ ] **Step 3:** dev 서버에서 Review Focus 다섯 항목을 차례로 확인한다. 토큰을 지운 상태에서 노션 버튼 오류 문구가 나오는지도 본다.
- [ ] **Step 4:** Commit: `docs: Notion integration setup`
