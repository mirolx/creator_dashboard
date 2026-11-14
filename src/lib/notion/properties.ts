import { NOTION_STATUS } from '../pipeline'
import type { KanbanCard } from '../types'

type CardFields = Pick<KanbanCard, 'title' | 'status' | 'shoot_on' | 'edit_due_on' | 'upload_on'>

const dateProp = (d: string | null) => ({ date: d ? { start: d } : null })

export function cardToNotionProperties(card: CardFields): Record<string, unknown> {
  return {
    제목: { title: [{ text: { content: card.title } }] },
    상태: { select: { name: NOTION_STATUS[card.status] } },
    촬영일: dateProp(card.shoot_on),
    '편집 마감일': dateProp(card.edit_due_on),
    업로드일: dateProp(card.upload_on),
  }
}

export function notionPageIdFromUrl(url: string): string | null {
  let path: string
  try {
    path = new URL(url).pathname
  } catch {
    return null
  }
  const last = path.split('/').filter(Boolean).pop()
  if (!last) return null
  const m = last.split(/[?#]/)[0].match(/([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})$/i)
  if (!m) return null
  const h = m[1].replace(/-/g, '').toLowerCase()
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** 페이지 ID만 아는 카드의 Notion 주소를 다시 만든다. */
export function notionUrlFromPageId(id: string): string {
  return `https://www.notion.so/${id.replace(/-/g, '')}`
}
