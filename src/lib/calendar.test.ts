import { describe, expect, it } from 'vitest'
import { monthGrid, moveScheduledAt, seoulTimeAt, toCalendarBlocks } from './calendar'
import type { KanbanCard, ScheduleItem } from './types'

function card(over: Partial<KanbanCard> = {}): KanbanCard {
  return {
    id: 'c1',
    workspace_id: 'w1',
    title: 'video',
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

function item(over: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    id: 's1',
    workspace_id: 'w1',
    title: 'event',
    kind: 'upload',
    scheduled_at: '2026-11-15T01:00:00Z',
    is_done: false,
    created_at: '2026-11-01T00:00:00Z',
    ...over,
  }
}

describe('monthGrid', () => {
  it('starts on the Monday before the 1st and ends on a Sunday', () => {
    expect(monthGrid(2026, 11)[0]).toBe('2026-10-26') // 11/1은 일요일 → 앞 월요일부터
    expect(monthGrid(2026, 11).at(-1)).toBe('2026-12-06')
    expect(monthGrid(2026, 11)).toHaveLength(42)
  })
  it('uses five weeks when the month fits', () => {
    expect(monthGrid(2026, 2)[0]).toBe('2026-01-26') // 2026-02-01은 일요일
    expect(monthGrid(2026, 2)).toHaveLength(35) // 1/26 ~ 3/1
    expect(monthGrid(2026, 2).at(-1)).toBe('2026-03-01')
  })
  it('starts on the 1st when the 1st is a Monday', () => {
    expect(monthGrid(2026, 6)[0]).toBe('2026-06-01')
  })
})

describe('toCalendarBlocks', () => {
  it('makes one block per filled card date and marks archived', () => {
    const blocks = toCalendarBlocks(
      [
        card({ id: 'a', shoot_on: '2026-11-03', upload_on: '2026-11-10' }),
        card({ id: 'b', edit_due_on: '2026-11-05', archived_at: '2026-11-06T00:00:00Z' }),
        card({ id: 'c' }),
      ],
      [],
    )
    expect(blocks).toHaveLength(3)
    expect(blocks.map((b) => [b.date, b.kind, b.archived])).toEqual([
      ['2026-11-03', 'shoot', false],
      ['2026-11-10', 'upload', false],
      ['2026-11-05', 'edit', true],
    ])
    expect(blocks[0].source).toEqual({ type: 'card', id: 'a', field: 'shoot_on' })
    expect(new Set(blocks.map((b) => b.key)).size).toBe(3)
  })
  it('dates schedule items in Seoul time', () => {
    // 2026-11-15T15:30:00Z 는 서울 16일 00:30
    const [block] = toCalendarBlocks([], [item({ scheduled_at: '2026-11-15T15:30:00Z' })])
    expect(block.date).toBe('2026-11-16')
    expect(block.kind).toBe('event')
    expect(block.source).toEqual({ type: 'schedule', id: 's1' })
  })
})

describe('moveScheduledAt', () => {
  it('keeps the Seoul wall-clock time and changes the Seoul date', () => {
    expect(moveScheduledAt('2026-11-15T15:30:00Z', '2026-11-20')).toBe('2026-11-19T15:30:00.000Z')
    expect(moveScheduledAt('2026-11-15T01:00:00+00:00', '2026-12-01')).toBe('2026-12-01T01:00:00.000Z')
  })
})

describe('seoulTimeAt', () => {
  it('returns the UTC ISO of a Seoul wall-clock time on a date', () => {
    expect(seoulTimeAt('2026-11-20', '10:00')).toBe('2026-11-20T01:00:00.000Z')
  })
})
