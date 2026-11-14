'use client'

import { useState, type DragEvent, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { fieldClass } from '@/components/ui/field'
import { seoulDateString } from '@/lib/dates'
import { newId } from '@/lib/id'
import { dropPlacement, isActive } from '@/lib/pipeline'
import { positionAfter } from '@/lib/position'
import { useLiveList } from '@/lib/realtime/useLiveList'
import { useWorkspaceId } from '@/lib/realtime/WorkspaceRealtime'
import { KANBAN_STATUSES, type KanbanCard, type KanbanStatus } from '@/lib/types'
import { textSchema } from '@/lib/validation'
import { byPosition, kanbanData } from './data'
import { PipelineCard } from './PipelineCard'
import { useNotionSync } from './useNotionSync'

/** 바뀌면 Notion 페이지에 다시 반영해야 하는 필드 */
const SYNCED_FIELDS = ['title', 'status', 'shoot_on', 'edit_due_on', 'upload_on'] as const

function touchesNotion(card: KanbanCard, patch: Partial<KanbanCard>) {
  return SYNCED_FIELDS.some((k) => k in patch && patch[k] !== card[k])
}

const DRAG_TYPE = 'application/x-creator-dashboard-card'
const INTERACTIVE = 'input, select, textarea, button, a'

export function PipelineBoard({ initial }: { initial: KanbanCard[] }) {
  const t = useTranslations('pipeline')
  const tc = useTranslations('common')
  const workspaceId = useWorkspaceId()
  const { rows, mutate, error } = useLiveList('kanban_cards', initial, byPosition)
  const { schedule, failed, retry } = useNotionSync()
  const [title, setTitle] = useState('')
  const [dragOver, setDragOver] = useState<KanbanStatus | null>(null)
  const active = rows.filter(isActive)
  const today = seoulDateString(new Date())

  const endOf = (status: KanbanStatus) =>
    positionAfter(active.filter((r) => r.status === status).map((r) => r.position))

  function add(e: FormEvent) {
    e.preventDefault()
    const parsed = textSchema.safeParse(title)
    if (!parsed.success) return
    const row: KanbanCard = {
      id: newId(),
      workspace_id: workspaceId,
      title: parsed.data,
      status: 'idea',
      position: endOf('idea'),
      notion_url: null,
      notion_page_id: null,
      shoot_on: null,
      edit_due_on: null,
      upload_on: null,
      archived_at: null,
      created_at: new Date().toISOString(),
    }
    setTitle('')
    void mutate({ type: 'INSERT', row }, () => kanbanData.insert(row))
  }

  async function update(card: KanbanCard, patch: Partial<KanbanCard>) {
    const ok = await mutate({ type: 'UPDATE', row: { ...card, ...patch } }, () =>
      kanbanData.update(card.id, patch),
    )
    if (ok && card.notion_page_id && touchesNotion(card, patch)) schedule(card.id)
    return ok
  }

  function remove(card: KanbanCard) {
    void mutate({ type: 'DELETE', id: card.id }, () => kanbanData.remove(card.id))
  }

  function drop(e: DragEvent, status: KanbanStatus, beforeId: string | null) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(null)
    const id = e.dataTransfer.getData(DRAG_TYPE)
    const card = active.find((c) => c.id === id)
    const placement = card && dropPlacement(active, card.id, status, beforeId)
    if (card && placement) void update(card, placement)
  }

  function allowDrop(e: DragEvent, status: KanbanStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOver !== status) setDragOver(status)
  }

  return (
    <section>
      {error && (
        <p role="alert" className="mb-3 rounded-xl bg-danger/15 px-3 py-2 text-sm font-medium text-danger">
          {tc('saveFailed')}
        </p>
      )}
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          aria-label={t('cardLabel')}
          placeholder={t('cardLabel')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${fieldClass} flex-1`}
        />
        <Button type="submit" size="sm" variant="primary">
          {tc('add')}
        </Button>
      </form>

      <div className="grid auto-cols-[minmax(15rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
        {KANBAN_STATUSES.map((status) => {
          const cards = active.filter((r) => r.status === status)
          return (
            <div
              key={status}
              onDragOver={(e) => allowDrop(e, status)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(null)
              }}
              onDrop={(e) => drop(e, status, null)}
              className={`flex min-h-40 flex-col rounded-2xl border border-line bg-panel p-3 transition-shadow ${
                dragOver === status ? 'ring-2 ring-accent' : ''
              }`}
            >
              <h4 className={`mb-2 text-sm font-bold ${cards.length > 0 ? 'text-accent' : 'text-muted'}`}>
                {t(`statuses.${status}`)} <span className="opacity-60">{cards.length}</span>
              </h4>
              {cards.length === 0 ? (
                <p className="text-xs opacity-50">{dragOver === status ? t('dropHere') : t('emptyColumn')}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {cards.map((card) => (
                    <li
                      key={card.id}
                      draggable
                      // 입력칸·버튼에서 시작한 누름은 텍스트 선택/클릭이 되도록 끌기를 끈다.
                      onPointerDown={(e) => {
                        e.currentTarget.draggable = !(e.target as HTMLElement).closest(INTERACTIVE)
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(DRAG_TYPE, card.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => setDragOver(null)}
                      onDrop={(e) => drop(e, status, card.id)}
                      className="cursor-grab rounded-xl bg-cream p-3 text-ink active:cursor-grabbing"
                    >
                      <PipelineCard
                        card={card}
                        today={today}
                        syncFailed={failed.has(card.id)}
                        onUpdate={(patch) => update(card, patch)}
                        onMove={(next) => void update(card, { status: next, position: endOf(next) })}
                        onDelete={() => remove(card)}
                        onRetrySync={() => retry(card.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
