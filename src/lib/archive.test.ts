import { describe, expect, it } from 'vitest'
import { sortArchived, unarchivePatch } from './archive'
import type { KanbanCard } from './types'

let seq = 0
function card(over: Partial<KanbanCard> = {}): KanbanCard {
  seq += 1
  return {
    id: `c${seq}`,
    workspace_id: 'w1',
    title: 't',
    status: 'published',
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

describe('archive', () => {
  it('sorts by upload date desc, undated last by archived_at desc', () => {
    const a = card({ upload_on: '2026-10-01', archived_at: '2026-11-10T00:00:00Z' })
    const b = card({ upload_on: '2026-11-05', archived_at: '2026-11-06T00:00:00Z' })
    const c = card({ upload_on: null, archived_at: '2026-11-01T00:00:00Z' })
    const d = card({ upload_on: null, archived_at: '2026-11-12T00:00:00Z' })
    expect(sortArchived([c, a, d, b]).map((x) => x.id)).toEqual([b.id, a.id, d.id, c.id])
  })

  it('does not mutate its input', () => {
    const list = [card({ upload_on: '2026-01-01' }), card({ upload_on: '2026-02-01' })]
    const ids = list.map((x) => x.id)
    sortArchived(list)
    expect(list.map((x) => x.id)).toEqual(ids)
  })

  it('unarchive goes to the end of active published cards', () => {
    const cards = [card({ status: 'published', position: 3 }), card({ status: 'published', position: 9, archived_at: 'x' })]
    expect(unarchivePatch(cards)).toEqual({ archived_at: null, status: 'published', position: 4 })
  })

  it('ignores active cards in other stages', () => {
    const cards = [card({ status: 'idea', position: 20 }), card({ status: 'published', position: 2 })]
    expect(unarchivePatch(cards).position).toBe(3)
  })

  it('unarchive into an empty published column', () => {
    expect(unarchivePatch([card({ status: 'edit', position: 5 })])).toEqual({
      archived_at: null,
      status: 'published',
      position: 1,
    })
  })
})
