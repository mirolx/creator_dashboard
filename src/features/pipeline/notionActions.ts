'use server'

import { z } from 'zod'
import { requireUser } from '@/lib/auth/requireUser'
import { createNotionPage, NotionError, updateNotionPage, type NotionErrorCode } from '@/lib/notion/client'
import { cardToNotionProperties, notionPageIdFromUrl } from '@/lib/notion/properties'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, KanbanCard } from '@/lib/types'

const COLUMNS = 'id,title,status,notion_url,notion_page_id,shoot_on,edit_due_on,upload_on'
type Row = Pick<
  KanbanCard,
  'id' | 'title' | 'status' | 'notion_url' | 'notion_page_id' | 'shoot_on' | 'edit_due_on' | 'upload_on'
>

function toCode(e: unknown): NotionErrorCode {
  return e instanceof NotionError ? e.code : 'failed'
}

async function readCard(cardId: string): Promise<Row | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('kanban_cards').select(COLUMNS).eq('id', cardId).maybeSingle()
  return (data as Row | null) ?? null
}

/** 카드에 연결된 Notion 페이지 URL을 돌려준다. 없으면 한 번만 만든다. */
export async function openNotionPage(cardId: string): Promise<{ url: string } | { error: NotionErrorCode | 'invalid' }> {
  if (!z.uuid().safeParse(cardId).success) return { error: 'invalid' }
  await requireUser()

  const card = await readCard(cardId)
  if (!card) return { error: 'invalid' }
  if (card.notion_page_id && card.notion_url) return { url: card.notion_url }

  const supabase = await createClient()

  if (card.notion_url) {
    const pageId = notionPageIdFromUrl(card.notion_url)
    if (pageId) {
      await supabase.from('kanban_cards').update({ notion_page_id: pageId }).eq('id', cardId).is('notion_page_id', null)
    }
    return { url: card.notion_url }
  }

  try {
    const page = await createNotionPage(cardToNotionProperties(card))
    const { data, error } = await supabase
      .from('kanban_cards')
      .update({ notion_page_id: page.id, notion_url: page.url })
      .eq('id', cardId)
      .is('notion_page_id', null)
      .select('notion_url')
    if (error) return { error: 'failed' }
    // 동시에 눌러 다른 요청이 먼저 저장했다면 먼저 저장된 값을 돌려준다.
    if (!data || data.length === 0) {
      const latest = await readCard(cardId)
      return latest?.notion_url ? { url: latest.notion_url } : { url: page.url }
    }
    return { url: page.url }
  } catch (e) {
    return { error: toCode(e) }
  }
}

/** 연결된 Notion 페이지에 카드 내용을 한 방향으로 반영한다. 연결이 없으면 아무것도 하지 않는다. */
export async function syncNotionPage(cardId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(cardId).success) return { error: 'invalid' }
  await requireUser()

  const card = await readCard(cardId)
  if (!card) return { error: 'invalid' }
  if (!card.notion_page_id) return { ok: true }

  try {
    await updateNotionPage(card.notion_page_id, cardToNotionProperties(card))
    return { ok: true }
  } catch (e) {
    return { error: toCode(e) }
  }
}
