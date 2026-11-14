import { describe, expect, it } from 'vitest'
import { cardToNotionProperties, notionPageIdFromUrl } from './properties'

describe('cardToNotionProperties', () => {
  it('maps a card to Notion properties', () => {
    expect(
      cardToNotionProperties({ title: '브이로그', status: 'shoot', shoot_on: '2026-11-20', edit_due_on: null, upload_on: null }),
    ).toEqual({
      제목: { title: [{ text: { content: '브이로그' } }] },
      상태: { select: { name: '촬영 예정' } },
      촬영일: { date: { start: '2026-11-20' } },
      '편집 마감일': { date: null },
      업로드일: { date: null },
    })
  })
})

describe('notionPageIdFromUrl', () => {
  const id = '01234567-89ab-cdef-0123-456789abcdef'
  it('parses slug urls', () => {
    expect(notionPageIdFromUrl('https://www.notion.so/My-Page-0123456789abcdef0123456789abcdef')).toBe(id)
  })
  it('parses /p/ urls with query', () => {
    expect(notionPageIdFromUrl('https://app.notion.com/p/0123456789abcdef0123456789abcdef?v=1')).toBe(id)
  })
  it('accepts dashed ids and uppercase', () => {
    expect(notionPageIdFromUrl('https://www.notion.so/01234567-89AB-CDEF-0123-456789ABCDEF#x')).toBe(id)
  })
  it('returns null without an id', () => {
    expect(notionPageIdFromUrl('https://www.notion.so/')).toBeNull()
    expect(notionPageIdFromUrl('not a url')).toBeNull()
  })
})
