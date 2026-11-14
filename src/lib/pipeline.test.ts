import { describe, expect, it } from 'vitest'
import { NOTION_STATUS, isActive, nextDue, positionAt } from './pipeline'
import type { KanbanCard } from './types'

function card(over: Partial<KanbanCard> = {}): KanbanCard {
  return {
    id: 'c1',
    workspace_id: 'w1',
    title: 't',
    status: 'idea',
    position: 1,
    notion_url: null,
    notion_page_id: null,
    shoot_on: null,
    edit_due_on: null,
    upload_on: null,
    archived_at: null,
    created_at: '2026-11-01T00:00:00Z',
    ...over,
  }
}

describe('pipeline', () => {
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
  it('nextDue counts whole days', () => {
    expect(nextDue(card({ upload_on: '2026-12-02' }), '2026-11-28')).toEqual({ field: 'upload_on', date: '2026-12-02', days: 4 })
  })
  it('isActive is false once archived', () => {
    expect(isActive(card({ archived_at: '2026-11-15T00:00:00Z' }))).toBe(false)
    expect(isActive(card())).toBe(true)
  })
})
