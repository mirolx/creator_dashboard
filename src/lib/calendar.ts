import { seoulDateString } from './dates'
import { CARD_DATE_FIELDS, type CardDateField, type KanbanCard, type ScheduleItem } from './types'

export type CalendarKind = 'shoot' | 'edit' | 'upload' | 'event'

export type CalendarBlock = {
  key: string
  date: string
  kind: CalendarKind
  title: string
  archived: boolean
  /** 완료한 기타 일정 (카드 블록은 항상 false) */
  done: boolean
  source: { type: 'card'; id: string; field: CardDateField } | { type: 'schedule'; id: string }
}

const FIELD_KIND: Record<CardDateField, CalendarKind> = {
  shoot_on: 'shoot',
  edit_due_on: 'edit',
  upload_on: 'upload',
}

/** 한국 시간은 서머타임 없이 UTC+9로 고정이다. */
const SEOUL_OFFSET_MS = 9 * 3_600_000
const DAY_MS = 86_400_000

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** month는 1–12. 월요일에 시작하는 주 단위 날짜 목록(앞뒤 달 날짜 포함, 길이 35 또는 42). */
export function monthGrid(year: number, month: number): string[] {
  const first = Date.UTC(year, month - 1, 1)
  const last = Date.UTC(year, month, 0)
  const lead = (new Date(first).getUTCDay() + 6) % 7 // 월요일 = 0
  const trail = (7 - new Date(last).getUTCDay()) % 7 // 일요일이면 0
  const start = first - lead * DAY_MS
  // 4주로 딱 떨어지는 2월도 최소 5주(35칸)로 채운다.
  const count = Math.max(35, Math.round((last - first) / DAY_MS) + 1 + lead + trail)
  return Array.from({ length: count }, (_, i) => isoDate(start + i * DAY_MS))
}

export function toCalendarBlocks(cards: KanbanCard[], items: ScheduleItem[]): CalendarBlock[] {
  const blocks: CalendarBlock[] = []
  for (const card of cards) {
    for (const field of CARD_DATE_FIELDS) {
      const date = card[field]
      if (!date) continue
      blocks.push({
        key: `card:${card.id}:${field}`,
        date,
        kind: FIELD_KIND[field],
        title: card.title,
        archived: card.archived_at !== null,
        done: false,
        source: { type: 'card', id: card.id, field },
      })
    }
  }
  for (const item of items) {
    blocks.push({
      key: `schedule:${item.id}`,
      date: seoulDateString(new Date(item.scheduled_at)),
      kind: 'event',
      title: item.title,
      archived: false,
      done: item.is_done,
      source: { type: 'schedule', id: item.id },
    })
  }
  return blocks
}

/** 서울 날짜 `date`(YYYY-MM-DD)의 서울 시각 `time`(HH:MM)을 UTC ISO로 */
export function seoulTimeAt(date: string, time: string): string {
  return new Date(Date.parse(`${date}T${time}:00Z`) - SEOUL_OFFSET_MS).toISOString()
}

/** 한국 시간 시각은 유지하고 날짜만 `date`로 바꾼 UTC ISO 문자열 */
export function moveScheduledAt(iso: string, date: string): string {
  const seoulMs = new Date(iso).getTime() + SEOUL_OFFSET_MS
  const timeOfDay = ((seoulMs % DAY_MS) + DAY_MS) % DAY_MS
  return new Date(Date.parse(`${date}T00:00:00Z`) + timeOfDay - SEOUL_OFFSET_MS).toISOString()
}
