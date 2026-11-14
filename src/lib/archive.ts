import { isActive } from './pipeline'
import { positionAfter } from './position'
import type { KanbanCard } from './types'

/** 보관함 순서: 업로드일 최신순, 업로드일이 없는 카드는 뒤에 archived_at 최신순. */
export function sortArchived(cards: KanbanCard[]): KanbanCard[] {
  return [...cards].sort((a, b) => {
    if (a.upload_on && b.upload_on) return b.upload_on.localeCompare(a.upload_on)
    if (a.upload_on) return -1
    if (b.upload_on) return 1
    return (b.archived_at ?? '').localeCompare(a.archived_at ?? '')
  })
}

/** 보관을 풀면 '게시 완료' 칸의 활성 카드 맨 끝으로 돌아간다. */
export function unarchivePatch(
  cards: KanbanCard[],
): Pick<KanbanCard, 'archived_at' | 'status' | 'position'> {
  const positions = cards
    .filter((c) => isActive(c) && c.status === 'published')
    .map((c) => c.position)
  return { archived_at: null, status: 'published', position: positionAfter(positions) }
}
