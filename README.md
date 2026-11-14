# 크리에이터 대시보드

유튜브·인스타그램 크리에이터를 위한 올인원 대시보드. 콘텐츠 파이프라인(아이디어 → 촬영 → 편집 → 예약 업로드 → 게시), 월간 캘린더, 아이디어, 메모를 메뉴별 페이지에서 관리하고 Notion 콘텐츠 DB와 연결하며, 내 니치에 맞는 YouTube 트렌드 영상을 매일 추천받는다.

**🔗 배포:** https://content-dashboard1.vercel.app · **🌐 [English](#english)**

<p align="center">
  <img src="docs/images/dashboard-youtube.png" alt="YouTube 워크스페이스 대시보드 — 더스티 로즈 포인트" width="820">
</p>

<table>
  <tr>
    <td width="50%"><img src="docs/images/dashboard-instagram.png" alt="Instagram 워크스페이스 — 더스티 라벤더 포인트"></td>
    <td width="50%"><img src="docs/images/login.png" alt="로그인 화면"></td>
  </tr>
  <tr>
    <td align="center">Instagram 워크스페이스 (더스티 라벤더)</td>
    <td align="center">로그인</td>
  </tr>
</table>

## 주요 기능

### 워크스페이스
- **YouTube / Instagram 워크스페이스** 전환 — 탭을 바꾸면 데이터와 포인트 색(더스티 로즈 ↔ 더스티 라벤더)이 함께 바뀐다.
- **한국어 / English** UI 전환, 이메일·비밀번호 로그인.

### 메뉴
헤더 첫 줄에서 플랫폼(YouTube / Instagram)을, 둘째 줄에서 메뉴를 고른다. 플랫폼을 바꾸면 같은 메뉴의 다른 플랫폼 페이지로 간다.

| 메뉴 | 경로 | 내용 |
|---|---|---|
| 홈 | `/[platform]` | 오늘·이번 주 일정, 체크리스트, 단계별 카드 수 요약(누르면 파이프라인으로 이동), 성과(준비 중) |
| 캘린더 | `/[platform]/calendar` | 카드의 촬영·편집 마감·업로드 날짜와 기타 일정을 월간 그리드로 본다. 블록을 끌어 날짜를 바꾼다 |
| 파이프라인 | `/[platform]/pipeline` | 아이디어 · 촬영 · 편집 · 예약 업로드 · 게시 완료 5단계 칸반. 카드마다 날짜 3개와 **Notion 버튼** |
| 탐색 | `/[platform]/explore` | 오늘의 트렌드(YouTube만), 고정된 아이디어, 빠른 메모 |
| 보관함 | `/[platform]/archive` | 게시 완료 카드를 보관해 두는 곳. 파이프라인으로 되돌리거나 삭제 |
| 설정 | `/[platform]/settings` | 트렌드 키워드 · 벤치마킹 채널 설정 |

- **파이프라인** — 카드를 끌어서(HTML5 드래그 앤 드롭) 또는 단계 드롭다운으로 옮긴다. 게시 완료 칸의 카드는 **보관함으로** 보낼 수 있다.
- **Notion 연동** — 카드의 Notion 버튼을 누르면 Notion '콘텐츠' DB에 페이지를 만들고(이미 있으면 그 페이지를 열고) 새 탭으로 연다. 제목·단계·날짜를 바꾸면 Notion 페이지에도 반영된다. 설정 방법은 [Notion 연동 설정](#5-notion-연동-설정)을 본다.
- **레퍼런스와 해시태그 뱅크는 없앴다.** DB 테이블(`reference_items`, `hashtags`)과 저장된 데이터는 지우지 않았지만 지금은 쓰이지 않는다.

### 탐색 · 영감
- **오늘의 트렌드 추천** (YouTube) — 매일 오전 6시(한국 시간)에 자동으로 새로 가져온다
  - 📺 **벤치마킹 채널** — 등록한 채널의 최근 30일 인기 영상 (채널당 최대 2개, 이미 추천한 영상은 오래된 순으로 돌아가며)
  - 🔍 **키워드 추천** — 그룹별 키워드 풀(최대 100개)을 매일 로테이션해 OR 검색
  - 제목·태그·설명에 겹치는 키워드 수로 **관련도 순위**를 매기고, 맞은 키워드를 태그로 표시
  - 겹치는 키워드(alone ⊂ living alone)는 한 번만 세고, 한 화면에 여러 주제를 섞고, 최근 7일 안에 추천한 영상은 다시 추천하지 않음 ("다시 가져오기"를 누를 때마다 새 영상)
  - 3분 이하 숏츠와 니치 밖 카테고리는 제외, 마음에 드는 영상은 아이디어로 **고정**
- **고정된 아이디어 · 빠른 메모**

### 사용 경험
- **즉시 반영 + 실시간 동기화** — 입력은 바로 화면에 반영되고 실패하면 되돌아가며, 다른 탭·기기에도 새로고침 없이 반영된다.
- **자동 저장** — 메모와 인라인 수정은 입력을 멈추면 저장된다.
- **마그네틱 커서** — 탭과 버튼에 커서를 대면 커서가 버튼 모양으로 감싸고 버튼이 살짝 끌려온다 (터치 기기·동작 줄이기 설정에서는 꺼짐).

## UI 레이아웃

**다크 프레임 벤토 그리드.** 따뜻한 검정 배경 위에 크림 · 포인트 · 다크 세 가지 카드를 섞어 리듬을 만든다. 데스크톱은 12칸 그리드, 모바일(768px 미만)은 1열로 쌓인다. 메뉴마다 별도 페이지다.

| 구역 | 내용 |
|---|---|
| 헤더 첫 줄 | 알약 탭: YouTube · Instagram, 로그아웃 |
| 헤더 둘째 줄 | 알약 탭(메뉴): 홈 · 캘린더 · 파이프라인 · 탐색 · 보관함 · 설정 |
| 홈 | 이번 주 일정 · 체크리스트 · 단계별 카드 수 요약 · 성과 스냅샷 |
| 캘린더 | 월간 그리드(월~일) + 날짜 없는 카드 목록 |
| 파이프라인 | 5단계 칸을 가로로 배치, 좁은 화면에서는 가로 스크롤 |
| 탐색 | 오늘의 트렌드(📺 채널 / 🔍 키워드) · 고정된 아이디어 · 빠른 메모 |
| 푸터 | 글꼴 출처 표시 |


### 디자인 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| `ink` | `#1C1818` | 페이지 배경, 밝은 카드 위 글자 |
| `panel` | `#262020` | 다크 카드 |
| `line` | `#3A3131` | 다크 카드 테두리 |
| `cream` | `#F6EFEB` | 크림 카드, 어두운 배경 위 글자 |
| `muted` | `#A89A96` | 보조 글자 |
| `accent` | YouTube `#D4A5A5` · Instagram `#B5A5D4` | 포인트 (탭에 따라 자동 전환) |
| `danger` | `#E07A6F` | 삭제 · 에러 |

- 글꼴: 세종글꽃체 (한글 · 영문 공통), 제목은 굵게 · 자간 좁게
- 모양: 카드 모서리 20px, 버튼 · 탭 · 태그는 알약형, 카드 간격 8px
- 공용 컴포넌트: `Card`(cream · accent · dark), `Button`(primary · ink · ghost · danger), `IconButton`, `PillTabs`, `Tag`, 입력 필드 클래스 — `src/components/ui/`

## 모션 · 인터랙션

### 마그네틱 커서
[21st.dev의 Fluid Magnetic Cursor](https://21st.dev/@jahed/components/magnetic-cursor)를 바탕으로 다시 구현했다 (`src/components/ui/magnetic-cursor.tsx`, gsap).

| 동작 | 설명 |
|---|---|
| 따라다니기 | 원형 커서가 마우스를 부드럽게 따라온다 (lerp 0.1). 시스템 커서는 그대로 보인다 |
| 늘어남 | 빠르게 움직이면 이동 방향으로 늘어나고 회전한다 |
| 색 반전 | `mix-blend-mode: exclusion` + 대비 보정으로 밝은 카드 · 어두운 배경 어디서든 보인다 |
| 달라붙기 | 탭 · 버튼에 올리면 커서가 그 요소 모양(여백 포함)으로 변해 감싼다 |
| 끌어당김 | 호버한 요소가 커서 쪽으로 살짝 끌려오고(강도 0.35), 떠나면 탄성 있게 제자리로 돌아간다 |

- 적용 대상: `data-magnetic`이 붙은 요소 — 헤더 알약 탭, `Button`, 트렌드 고정 버튼, 트렌드 설정 화살표.
- 제외: 입력칸, 체크박스, 작은 아이콘 버튼(이동 · 삭제), 비활성 버튼.
- 이벤트 위임 방식이라 나중에 나타난 버튼도 동작하고, 호버 중인 버튼이 사라져도(추가 · 페이지 이동) 커서가 멈추지 않는다.
- 마우스가 없는 기기(`hover: hover`·`pointer: fine`이 아님)에서는 꺼진다. 터치스크린 노트북에서 마우스를 쓰면 켜진다.
- **동작 줄이기**(`prefers-reduced-motion`) 설정에서는 지연 · 늘어남 · 끌어당김 · 모양 변형 없이 원형 커서만 따라간다.

### 그 밖의 인터랙션
- **낙관적 업데이트:** 추가 · 수정 · 삭제 · 체크 · 칸반 이동이 서버 응답 전에 바로 보이고, 저장에 실패하면 바꾼 필드만 되돌린다.
- **실시간 동기화:** 다른 탭 · 기기에서 바꾼 내용이 새로고침 없이 나타난다 (Supabase Realtime).
- **자동 저장:** 메모와 인라인 수정은 입력을 멈추고 0.8초 뒤 저장, "저장 중… / 저장됨" 표시.
- **호버 · 포커스:** 버튼은 색만 부드럽게 전환(`transition-colors`, 커서 끌어당김과 충돌하지 않도록), 키보드 포커스에는 외곽선 링이 보인다.

## 기술 스택

| 영역 | 사용 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript |
| 스타일 | Tailwind CSS 4 (`@theme` 토큰), lucide-react, 세종글꽃체 |
| 백엔드 | Supabase — Postgres + RLS, Auth, Realtime |
| 외부 API | YouTube Data API v3, Notion API (콘텐츠 DB 연동) |
| 기타 | next-intl (ko/en), zod, gsap (마그네틱 커서) |
| 테스트 | Vitest (189개) |
| 배포 | Vercel |

## 시작하기

### 준비물 

| 항목 | 용도 |
|---|---|
| Node.js 22.12 이상 (권장 24) | 개발 서버 |
| Supabase 프로젝트 (무료 플랜) | DB, 로그인, 실시간 동기화 |
| Google Cloud 프로젝트 | YouTube Data API 키 |

### 1. Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 만든다.
2. **SQL Editor**에서 마이그레이션을 **순서대로 한 번씩** 실행한다.
   1. `supabase/migrations/0001_init.sql`
   2. `supabase/migrations/0002_trend_sources.sql`
   3. `supabase/migrations/0003_keyword_pool.sql`
   4. `supabase/migrations/0004_kanban_notion_links.sql`
   5. `supabase/migrations/0005_pipeline_calendar.sql` — 칸반을 5단계(아이디어·촬영·편집·예약 업로드·게시 완료)로 바꾸고 촬영일·편집 마감일·업로드일, Notion 페이지 ID, 보관 시각 컬럼을 추가한다. 기존 카드는 `shot→촬영`, `editing·review→편집`, `uploaded→게시 완료`로 옮겨진다.

   이미 운영 중인 프로젝트를 업데이트할 때는 새 코드를 배포하기 **전에** 새 마이그레이션을 먼저 실행한다. 순서가 바뀌면 실시간 동기화와 트렌드 조회가 실패한다.
3. `supabase/tests/rls_check.sql`을 실행해 결과가 `RLS OK`인지 확인한다.
4. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (배포 후에는 배포 주소)
   - Redirect URLs: `http://localhost:3000/auth/callback` (배포 후 `https://<배포 주소>/auth/callback` 추가)
5. **Project Settings → API**에서 Project URL과 anon(public) key를 복사해 둔다.

### 2. YouTube Data API 키

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 만든다.
2. **APIs & Services → Library**에서 "YouTube Data API v3"를 사용 설정한다.
3. **APIs & Services → Credentials → Create credentials → API key**로 키를 만든다.
4. 키 제한(API restrictions)을 "YouTube Data API v3"로 걸어 둔다.

하루 무료 할당량은 10,000 units. 트렌드를 한 번 가져올 때 약 430 units를 쓴다 (가장 오래 쓰지 않은 키워드 그룹 4개 × 검색 100 units + 벤치마킹 채널 최대 20개 + 영상 상세 조회). "오늘 트렌드 다시 가져오기"도 한 번에 같은 양을 쓴다. 결제 정보는 필요 없다.

### 3. 로컬 실행

```bash
cp .env.example .env.local   # 값 세 개를 채운다
npm install
npm run dev
```

http://localhost:3000 → 회원가입 → YouTube 대시보드.

| 환경변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon(public) key |
| `YOUTUBE_API_KEY` | YouTube Data API 키 (서버 전용, 절대 공개하지 않는다) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 — 매일 자동 트렌드(크론)용, 서버 전용. **Project Settings → API Keys**에서 복사 |
| `CRON_SECRET` | 크론 주소를 보호하는 임의 문자열 (16자 이상). 로컬에서는 비워 둬도 된다 |
| `NOTION_TOKEN` | Notion 내부 통합 토큰 (서버 전용, 절대 공개하지 않는다). 없으면 Notion 버튼이 안내 메시지를 보여준다 |
| `NOTION_DATA_SOURCE_ID` | '콘텐츠' DB의 data source ID: `8818195e-fee9-4942-b7a4-a18d9b53adfe` |

### 4. Vercel 배포

1. Vercel에서 이 GitHub 저장소를 Import 한다 (Framework: Next.js).
2. **Environment Variables**에 위 일곱 값을 넣는다 (Production and Preview). `YOUTUBE_API_KEY`·`SUPABASE_SERVICE_ROLE_KEY`·`CRON_SECRET`·`NOTION_TOKEN`은 Sensitive로 표시한다.
3. 배포 후 Supabase의 Site URL과 Redirect URLs에 배포 주소를 추가한다 (1-4 참고).
4. 이후 `main`에 push하면 자동으로 다시 배포된다.
5. `vercel.json`의 크론이 매일 UTC 21시(한국 시간 오전 6시)에 `/api/cron/trends`를 호출해 모든 YouTube 워크스페이스의 트렌드를 미리 가져온다. **Settings → Cron Jobs**에서 Run으로 바로 실행해 볼 수 있다.

### 5. Notion 연동 설정

파이프라인 카드의 Notion 버튼을 쓰려면 배포 전에 아래를 한다.

1. [notion.so/my-integrations](https://www.notion.so/my-integrations)에서 **내부 통합**을 만든다. 콘텐츠 읽기 · 수정 · 추가 권한이 필요하다.
2. Notion의 '콘텐츠' DB 오른쪽 위 **···** → **연결**에서 방금 만든 통합을 추가한다. 이걸 빼먹으면 권한 오류가 난다.
3. Vercel(로컬에서 쓰려면 `.env.local`에도)에 `NOTION_TOKEN`(통합 토큰)과 `NOTION_DATA_SOURCE_ID`(`8818195e-fee9-4942-b7a4-a18d9b53adfe`)를 넣는다. `NOTION_TOKEN`은 Sensitive로 표시하고, 코드·README·채팅 등 다른 곳에는 붙여 넣지 않는다.
4. Supabase **SQL Editor**에서 `supabase/migrations/0005_pipeline_calendar.sql`을 실행한다. 새 코드를 배포하기 **전에** 먼저 실행해야 한다.

대시보드 → Notion 속성 매핑: 제목 → `제목`, 단계 → `상태`(아이디어 · 촬영 예정 · 편집 중 · 예약 업로드 · 게시 완료), 촬영일 → `촬영일`, 편집 마감일 → `편집 마감일`, 업로드일 → `업로드일`. YouTube와 Instagram 카드 모두 같은 DB에 만들어진다.

### 폰에서 테스트하기 (로컬)

1. PC와 폰을 같은 Wi-Fi에 연결하고 `npm run dev -- -H 0.0.0.0`으로 실행한다.
2. 폰 브라우저에서 `http://<PC의 내부 IP>:3000`으로 접속한다 (Windows: `ipconfig`).
3. Supabase Redirect URLs에 `http://<PC의 내부 IP>:3000/auth/callback`을 추가한다.
4. `next.config.ts`의 `allowedDevOrigins` 주석을 풀고 **PC의 내부 IP**를 넣는다 (Next.js 16 개발 서버는 localhost가 아닌 주소의 HMR 요청을 막는다. 커밋하지 않아도 된다).
5. 이메일 확인 링크는 Site URL을 가리키므로 **회원가입과 이메일 확인은 PC에서** 하고, 폰에서는 **로그인만** 한다.

## 명령어

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm test` | 단위 테스트 (Vitest) |
| `npm run typecheck` | 타입 체크 |
| `npm run lint` | ESLint |
| `npm run build` | 프로덕션 빌드 |

## 프로젝트 구조

```
src/
  app/                 # 라우트 (로그인, /[platform] 아래 홈·캘린더·파이프라인·탐색·보관함·설정, 인증 콜백)
  components/ui/       # Card, Button, PillTabs, Tag, 필드, 마그네틱 커서
  features/            # 메뉴·위젯별 UI + 데이터 (pipeline, calendar, archive, checklist, trends …)
  lib/
    realtime/          # 낙관적 업데이트, Realtime 구독, 자동 저장
    trends/            # 로테이션, OR 검색어, 관련도 점수, 4+4 합치기
    notion/            # Notion REST API 호출, 카드 ↔ 페이지 속성 매핑 (서버 전용)
    youtube/           # YouTube API 호출 (가짜 fetch로 테스트)
  i18n/                # next-intl 설정, 언어 저장
messages/              # ko.json / en.json
supabase/              # 마이그레이션, RLS 검증 스크립트
docs/superpowers/      # 설계 스펙과 구현 계획
```

설계 문서는 [`docs/superpowers/specs`](docs/superpowers/specs), 구현 계획은 [`docs/superpowers/plans`](docs/superpowers/plans)에 있다.

## 글꼴 라이선스

한글·영문 글꼴은 **세종글꽃체**(`src/app/fonts/SejongGeulggot.ttf`)를 사용한다.

- 저작권: 세종특별자치시 (공공저작물, 문화체육관광부 「공공저작물 저작권 관리 및 이용 지침」에 따라 무료 사용)
- 조건: 유료 양도·판매 금지, 변형 재배포 금지 → 이 저장소에는 **받은 원본 TTF를 수정 없이** 포함한다 (형식 변환·서브셋 금지).
- 출처 표시: 누리집 사용 시 저작권자를 밝혀야 하므로 모든 화면 하단에 "이 사이트는 세종특별자치시의 세종글꽃체를 사용합니다."를 표시한다.
- 참고: https://noonnu.cc/font_page/1523

---

<a id="english"></a>

# Creator Dashboard (English)

An all-in-one dashboard for YouTube and Instagram creators. Manage a content pipeline (idea → shoot → edit → scheduled → published), a monthly calendar, ideas, and notes on separate menu pages, link cards to your Notion content database, and get daily YouTube trend picks tuned to your niche.

**🔗 Live:** https://content-dashboard1.vercel.app

Screenshots are at the [top of this page](#크리에이터-대시보드).

## Features

### Workspaces
- **YouTube / Instagram workspaces** — switching tabs swaps both the data and the accent color (dusty rose ↔ dusty lavender).
- **Korean / English** UI toggle, email/password sign-in.

### Menu
The first header row picks the platform (YouTube / Instagram) and the second picks the page. Switching platform keeps you on the same page.

| Menu | Route | Contents |
|---|---|---|
| Home | `/[platform]` | Today/this-week schedule, checklist, per-stage card counts (click to open the pipeline), performance (coming soon) |
| Calendar | `/[platform]/calendar` | Card shoot / edit-due / upload dates and other events on a monthly grid; drag blocks to change dates |
| Pipeline | `/[platform]/pipeline` | Five-stage kanban: Idea · Shoot · Edit · Scheduled · Published. Each card has three dates and a **Notion button** |
| Explore | `/[platform]/explore` | Today's trends (YouTube only), pinned ideas, quick notes |
| Archive | `/[platform]/archive` | Where published cards are kept; restore them to the pipeline or delete |
| Settings | `/[platform]/settings` | Trend keywords and benchmark channels |

- **Pipeline** — move cards by drag and drop (HTML5) or with the stage dropdown. Cards in Published can be sent **to the archive**.
- **Notion integration** — the card's Notion button creates a page in the Notion "콘텐츠" database (or opens the existing one) in a new tab. Title, stage, and date changes sync to the page. See [Notion setup](#5-notion-setup).
- **References and the hashtag bank were removed.** Their DB tables (`reference_items`, `hashtags`) and stored data still exist but are unused.

### Explore & inspiration
- **Today's trending topics** (YouTube) — refreshed automatically every day at 6 AM KST
  - 📺 **Benchmark channels** — the most-viewed videos from your chosen channels in the last 30 days (max 2 per channel; already shown ones rotate, oldest first)
  - 🔍 **Keyword picks** — a grouped keyword pool (up to 100) rotated daily into OR searches
  - Ranked by **relevance** (how many of your keywords appear in the title, tags, and description), with the matched keywords shown as tags
  - Overlapping keywords (alone ⊂ living alone) count once, topics are mixed on each screen, and videos picked in the last 7 days are skipped (every "fetch again" brings new videos)
  - Shorts (3 minutes or less) and off-niche categories are skipped; pin any video as an idea
- **Pinned ideas · Quick notes**

### Experience
- **Instant updates + realtime sync** — changes appear immediately, roll back on failure, and show up in other tabs/devices without refreshing.
- **Autosave** — notes and inline edits save when you stop typing.
- **Magnetic cursor** — hovering tabs and buttons wraps them with the cursor and pulls them slightly (off on touch devices and with reduced motion).

## UI layout

**Dark-frame bento grid.** A warm black background with a mix of cream, accent, and dark cards. 12 columns on desktop, a single column below 768px. Each menu is its own page.

| Area | Contents |
|---|---|
| Header, row 1 | Pill tabs: YouTube · Instagram, log out |
| Header, row 2 | Pill tabs (menu): Home · Calendar · Pipeline · Explore · Archive · Settings |
| Home | This week's schedule · checklist · per-stage counts · performance snapshot |
| Calendar | Monthly grid (Mon–Sun) + list of cards without dates |
| Pipeline | Five stage columns side by side; scrolls horizontally on narrow screens |
| Explore | Today's trends (📺 channels / 🔍 keywords) · pinned ideas · quick notes |
| Footer | Font credit |

### Design tokens

| Token | Value | Use |
|---|---|---|
| `ink` | `#1C1818` | Page background, text on light cards |
| `panel` | `#262020` | Dark cards |
| `line` | `#3A3131` | Dark card borders |
| `cream` | `#F6EFEB` | Cream cards, text on dark |
| `muted` | `#A89A96` | Secondary text |
| `accent` | YouTube `#D4A5A5` · Instagram `#B5A5D4` | Accent (switches with the tab) |
| `danger` | `#E07A6F` | Delete, errors |

- Font: SejongGeulggot for both Korean and English; bold, tight headings
- Shape: 20px card radius, pill buttons/tabs/tags, 8px gaps
- Shared components: `Card` (cream · accent · dark), `Button` (primary · ink · ghost · danger), `IconButton`, `PillTabs`, `Tag`, field classes — `src/components/ui/`

## Motion & interaction

### Magnetic cursor
Rebuilt from the [Fluid Magnetic Cursor on 21st.dev](https://21st.dev/@jahed/components/magnetic-cursor) (`src/components/ui/magnetic-cursor.tsx`, gsap).

| Behavior | Description |
|---|---|
| Follow | A circle smoothly trails the mouse (lerp 0.1); the system cursor stays visible |
| Stretch | Fast movement stretches and rotates it in the direction of travel |
| Invert | `mix-blend-mode: exclusion` plus a contrast boost keeps it visible on light cards and dark backgrounds |
| Snap | Hovering a tab or button morphs the cursor into that element's shape (with padding) |
| Pull | The hovered element drifts toward the cursor (strength 0.35) and springs back elastically on leave |

- Applies to elements with `data-magnetic`: header pill tabs, `Button`, trend pin buttons, and the trends settings arrow.
- Excluded: inputs, checkboxes, small icon buttons (move/delete), disabled buttons.
- Uses event delegation, so late-rendered buttons work, and the cursor keeps moving if the hovered button disappears (after adding an item or navigating).
- Off on devices without a fine pointer (`hover: hover` and `pointer: fine`); on touchscreen laptops it turns on when you use a mouse.
- With **reduced motion** (`prefers-reduced-motion`), only a plain circle follows the pointer: no lag, stretch, pull, or morph.

### Other interactions
- **Optimistic updates:** add, edit, delete, check, and kanban moves show before the server responds; on failure only the changed fields roll back.
- **Realtime sync:** changes from other tabs and devices appear without refreshing (Supabase Realtime).
- **Autosave:** notes and inline edits save 0.8s after you stop typing, with a "Saving… / Saved" indicator.
- **Hover & focus:** buttons only transition colors (`transition-colors`, so CSS doesn't fight the cursor pull), and keyboard focus shows an outline ring.

## Tech stack

| Area | Used |
|---|---|
| Framework | Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript |
| Styling | Tailwind CSS 4 (`@theme` tokens), lucide-react, SejongGeulggot font |
| Backend | Supabase — Postgres + RLS, Auth, Realtime |
| External API | YouTube Data API v3, Notion API (content DB sync) |
| Other | next-intl (ko/en), zod, gsap (magnetic cursor) |
| Tests | Vitest (189) |
| Hosting | Vercel |

## Getting started

### Prerequisites (all free)

| Item | Purpose |
|---|---|
| Node.js 22.12+ (24 recommended) | Dev server |
| Supabase project (free plan) | Database, auth, realtime |
| Google Cloud project | YouTube Data API key |

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run the migrations **once each, in order**:
   1. `supabase/migrations/0001_init.sql`
   2. `supabase/migrations/0002_trend_sources.sql`
   3. `supabase/migrations/0003_keyword_pool.sql`
   4. `supabase/migrations/0004_kanban_notion_links.sql`
   5. `supabase/migrations/0005_pipeline_calendar.sql` — switches the kanban to five stages (Idea · Shoot · Edit · Scheduled · Published) and adds shoot / edit-due / upload dates, a Notion page ID, and an archive timestamp. Existing cards move `shot→Shoot`, `editing·review→Edit`, `uploaded→Published`.

   When updating an existing deployment, run new migrations **before** deploying the new code; otherwise realtime sync and trend fetching fail.
3. Run `supabase/tests/rls_check.sql` and confirm it returns `RLS OK`.
4. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (your deployed URL after deploying)
   - Redirect URLs: `http://localhost:3000/auth/callback` (add `https://<deployed URL>/auth/callback` after deploying)
5. Copy the Project URL and anon (public) key from **Project Settings → API**.

### 2. YouTube Data API key

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable "YouTube Data API v3" under **APIs & Services → Library**.
3. Create a key under **APIs & Services → Credentials → Create credentials → API key**.
4. Restrict the key to "YouTube Data API v3".

The free quota is 10,000 units per day. One trend fetch uses about 430 units (4 least-recently searched keyword groups × one 100-unit search + up to 20 benchmark channels + video details). "Fetch today's trends again" costs the same. No billing is required.

### 3. Run locally

```bash
cp .env.example .env.local   # fill in the first three values (the cron ones are optional locally)
npm install
npm run dev
```

Open http://localhost:3000 → sign up → YouTube dashboard.

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `YOUTUBE_API_KEY` | YouTube Data API key (server only — never publish it) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key for the daily trend cron (server only; **Project Settings → API Keys**) |
| `CRON_SECRET` | Any random string (16+ chars) that protects the cron URL. Can stay empty locally |
| `NOTION_TOKEN` | Notion internal integration token (server only — never publish it). Without it the Notion button shows an explanatory message |
| `NOTION_DATA_SOURCE_ID` | Data source ID of the "콘텐츠" database: `8818195e-fee9-4942-b7a4-a18d9b53adfe` |

### 4. Deploy to Vercel

1. Import this GitHub repository in Vercel (framework: Next.js).
2. Add the seven **Environment Variables** (Production and Preview); mark `YOUTUBE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and `NOTION_TOKEN` as Sensitive.
3. After deploying, add the deployed URL to Supabase's Site URL and Redirect URLs (see 1-4).
4. Every push to `main` redeploys automatically.
5. The cron in `vercel.json` calls `/api/cron/trends` daily at 21:00 UTC (6 AM KST) to prefetch trends for every YouTube workspace. Use **Settings → Cron Jobs → Run** to trigger it manually.

### 5. Notion setup

To use the Notion button on pipeline cards, do this before deploying.

1. Create an **internal integration** at [notion.so/my-integrations](https://www.notion.so/my-integrations) with read, update, and insert content capabilities.
2. In Notion, open the "콘텐츠" database's **···** menu → **Connections** and add that integration. Skipping this causes permission errors.
3. Set `NOTION_TOKEN` (the integration token) and `NOTION_DATA_SOURCE_ID` (`8818195e-fee9-4942-b7a4-a18d9b53adfe`) in Vercel (and in `.env.local` for local use). Mark `NOTION_TOKEN` as Sensitive and never paste it anywhere else (code, README, chat).
4. Run `supabase/migrations/0005_pipeline_calendar.sql` in the Supabase **SQL Editor** **before** deploying the new code.

Property mapping (dashboard → Notion): title → `제목`, stage → `상태` (아이디어 · 촬영 예정 · 편집 중 · 예약 업로드 · 게시 완료), shoot date → `촬영일`, edit-due date → `편집 마감일`, upload date → `업로드일`. YouTube and Instagram cards both go into the same database.

### Testing on a phone (local)

1. Put your PC and phone on the same Wi-Fi and run `npm run dev -- -H 0.0.0.0`.
2. Open `http://<PC LAN IP>:3000` on the phone (Windows: `ipconfig`).
3. Add `http://<PC LAN IP>:3000/auth/callback` to Supabase Redirect URLs.
4. Uncomment `allowedDevOrigins` in `next.config.ts` and set it to **your PC's LAN IP** (the Next.js 16 dev server blocks HMR from non-localhost origins; no need to commit this).
5. Confirmation emails link to the Site URL, so **sign up and confirm on the PC**, then only **log in** on the phone.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | Type check |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## Project structure

```
src/
  app/                 # routes (login, home/calendar/pipeline/explore/archive/settings under /[platform], auth callback)
  components/ui/       # Card, Button, PillTabs, Tag, fields, magnetic cursor
  features/            # per-menu/widget UI + data (pipeline, calendar, archive, checklist, trends …)
  lib/
    realtime/          # optimistic updates, Realtime subscriptions, autosave
    trends/            # rotation, OR queries, relevance scoring, 4+4 merge
    notion/            # Notion REST API calls, card ↔ page property mapping (server only)
    youtube/           # YouTube API calls (tested with a fake fetch)
  i18n/                # next-intl setup, locale persistence
messages/              # ko.json / en.json
supabase/              # migrations, RLS check script
docs/superpowers/      # design specs and implementation plans
```

Design specs live in [`docs/superpowers/specs`](docs/superpowers/specs) and implementation plans in [`docs/superpowers/plans`](docs/superpowers/plans) (written in Korean).

## Font license

Both Korean and English text use **SejongGeulggot** (`src/app/fonts/SejongGeulggot.ttf`).

- Copyright: Sejong Special Self-Governing City (public work, free to use under the Ministry of Culture, Sports and Tourism public-work guidelines)
- Terms: no paid transfer or sale, no redistribution of modified versions → this repository includes the **original TTF, unmodified** (no format conversion or subsetting).
- Credit: web use requires naming the copyright holder, so every page shows "This site uses the SejongGeulggot font by Sejong Special Self-Governing City." at the bottom.
- Source: https://noonnu.cc/font_page/1523
