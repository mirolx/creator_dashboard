export const PLATFORMS = ['youtube', 'instagram'] as const
export type Platform = (typeof PLATFORMS)[number]

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value)
}

export const SCHEDULE_KINDS = ['shoot', 'edit', 'upload'] as const
export type ScheduleKind = (typeof SCHEDULE_KINDS)[number]

export const KANBAN_STATUSES = ['idea', 'shoot', 'edit', 'scheduled', 'published'] as const
export type KanbanStatus = (typeof KANBAN_STATUSES)[number]

export const CARD_DATE_FIELDS = ['shoot_on', 'edit_due_on', 'upload_on'] as const
export type CardDateField = (typeof CARD_DATE_FIELDS)[number]

/** workspace_id 컬럼이 있고 Realtime으로 구독하는 테이블 */
export const WORKSPACE_TABLES = [
  'schedule_items',
  'checklist_items',
  'kanban_cards',
  'pinned_ideas',
  'trend_keywords',
  'benchmark_channels',
] as const
export type WorkspaceTable = (typeof WORKSPACE_TABLES)[number]
export type LiveTable = WorkspaceTable | 'workspaces'

export type Workspace = {
  id: string
  user_id: string
  platform: Platform
  name: string
  memo: string
  created_at: string
}

type WorkspaceRow = { id: string; workspace_id: string; created_at: string }

export type ScheduleItem = WorkspaceRow & {
  title: string
  kind: ScheduleKind
  scheduled_at: string
  is_done: boolean
}

export type ChecklistItem = WorkspaceRow & {
  content: string
  is_done: boolean
  position: number
}

export type KanbanCard = WorkspaceRow & {
  title: string
  status: KanbanStatus
  position: number
  /** 연결된 Notion 페이지 (없으면 null) */
  notion_url: string | null
  /** 동기화된 Notion 페이지 ID (없으면 null) */
  notion_page_id: string | null
  /** 촬영일 / 편집 마감일 / 업로드일 (YYYY-MM-DD) */
  shoot_on: string | null
  edit_due_on: string | null
  upload_on: string | null
  /** 보관 처리된 시각 (보관 전이면 null) */
  archived_at: string | null
}

export type TrendKeyword = WorkspaceRow & {
  keyword: string
  group_name: string | null
  last_searched_on: string | null
}

export type TrendSource = 'channel' | 'keyword'

export type TrendTopic = WorkspaceRow & {
  fetched_on: string
  video_id: string
  title: string
  channel_title: string
  view_count: number
  thumbnail_url: string
  source: TrendSource
  relevance: number
  matched_keywords: string[]
}

export type BenchmarkChannel = WorkspaceRow & {
  channel_id: string
  handle: string | null
  title: string
  thumbnail_url: string
  uploads_playlist_id: string
}

export type PinnedIdea = WorkspaceRow & {
  title: string
  note: string
  source_url: string | null
  thumbnail_url: string | null
}

export type ActionResult = { ok: true } | { error: string }
