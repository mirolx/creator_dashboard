import { positionBetween } from './position'
import {
  CARD_DATE_FIELDS,
  type CardDateField,
  type KanbanCard,
  type KanbanStatus,
} from './types'

/** 각 단계에 대응하는 Notion 상태 옵션 이름 */
export const NOTION_STATUS: Record<KanbanStatus, string> = {
  idea: '아이디어',
  shoot: '촬영 예정',
  edit: '편집 중',
  scheduled: '예약 업로드',
  published: '게시 완료',
}

export function isActive(card: KanbanCard): boolean {
  return card.archived_at === null
}

/** 정렬된 칸의 `index` 자리에 끼울 position */
export function positionAt(sorted: number[], index: number): number {
  return positionBetween(sorted[index - 1], sorted[index])
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

/** 오늘(포함) 이후 가장 가까운 카드 일정. 없으면 null. */
export function nextDue(
  card: KanbanCard,
  today: string,
): { field: CardDateField; date: string; days: number } | null {
  let best: { field: CardDateField; date: string; days: number } | null = null
  for (const field of CARD_DATE_FIELDS) {
    const date = card[field]
    if (!date || date < today) continue
    const days = dayNumber(date) - dayNumber(today)
    if (!best || days < best.days) best = { field, date, days }
  }
  return best
}
