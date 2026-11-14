'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/ui/button'
import { fieldClass, selectClass } from '@/components/ui/field'
import { monthGrid, moveScheduledAt, seoulTimeAt, toCalendarBlocks, type CalendarBlock } from '@/lib/calendar'
import { seoulDateString } from '@/lib/dates'
import { newId } from '@/lib/id'
import { isActive } from '@/lib/pipeline'
import { useLiveList } from '@/lib/realtime/useLiveList'
import { useWorkspaceId } from '@/lib/realtime/WorkspaceRealtime'
import {
  SCHEDULE_KINDS,
  type KanbanCard,
  type Platform,
  type ScheduleItem,
  type ScheduleKind,
} from '@/lib/types'
import { textSchema } from '@/lib/validation'
import { byPosition, kanbanData } from '@/features/pipeline/data'
import { useNotionSync } from '@/features/pipeline/useNotionSync'
import { scheduleData } from '@/features/schedule/data'
import { CardDatePopover, FloatingPanel } from './CardDatePopover'
import { DayCell, DRAG_TYPE, KIND_CLASS } from './DayCell'

const byDate = (a: ScheduleItem, b: ScheduleItem) =>
  new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()

/** 날짜 없는 카드를 끌거나 고를 때 쓰는 토큰 (블록은 block.key) */
const UNDATED = 'undated:'
const DEFAULT_TIME = '10:00'

type Month = { year: number; month: number }

function monthOf(date: string): Month {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) }
}

function shift({ year, month }: Month, delta: number): Month {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export function CalendarView({
  platform,
  initialCards,
  initialItems,
}: {
  platform: Platform
  initialCards: KanbanCard[]
  initialItems: ScheduleItem[]
}) {
  const t = useTranslations('calendar')
  const tc = useTranslations('common')
  const format = useFormatter()
  const cards = useLiveList('kanban_cards', initialCards, byPosition)
  const items = useLiveList('schedule_items', initialItems, byDate)
  const { schedule } = useNotionSync()
  const today = seoulDateString(new Date())
  const [view, setView] = useState<Month>(() => monthOf(today))
  const [selected, setSelected] = useState<string | null>(null)
  const [popoverId, setPopoverId] = useState<string | null>(null)
  const [addingOn, setAddingOn] = useState<string | null>(null)

  const grid = useMemo(() => monthGrid(view.year, view.month), [view])
  const blocks = useMemo(() => toCalendarBlocks(cards.rows, items.rows), [cards.rows, items.rows])
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarBlock[]>()
    for (const block of blocks) map.set(block.date, [...(map.get(block.date) ?? []), block])
    return map
  }, [blocks])
  const undated = cards.rows.filter(
    (c) => isActive(c) && !c.shoot_on && !c.edit_due_on && !c.upload_on,
  )
  const popoverCard = popoverId ? cards.rows.find((c) => c.id === popoverId) : undefined
  const monthPrefix = `${view.year}-${String(view.month).padStart(2, '0')}`

  async function updateCard(card: KanbanCard, patch: Partial<KanbanCard>) {
    const ok = await cards.mutate({ type: 'UPDATE', row: { ...card, ...patch } }, () =>
      kanbanData.update(card.id, patch),
    )
    if (ok && card.notion_page_id) schedule(card.id)
  }

  function updateItem(item: ScheduleItem, patch: Partial<ScheduleItem>) {
    void items.mutate({ type: 'UPDATE', row: { ...item, ...patch } }, () =>
      scheduleData.update(item.id, patch),
    )
  }

  /** 토큰이 가리키는 블록(또는 날짜 없는 카드)을 date로 옮긴다. 같은 날이면 쓰지 않는다. */
  function moveTo(token: string, date: string) {
    setSelected(null)
    if (token.startsWith(UNDATED)) {
      const card = cards.rows.find((c) => c.id === token.slice(UNDATED.length))
      if (card) void updateCard(card, { upload_on: date })
      return
    }
    const block = blocks.find((b) => b.key === token)
    if (!block || block.date === date) return
    const { source } = block
    if (source.type === 'card') {
      const card = cards.rows.find((c) => c.id === source.id)
      if (card) void updateCard(card, { [source.field]: date })
    } else {
      const item = items.rows.find((i) => i.id === source.id)
      if (item) updateItem(item, { scheduled_at: moveScheduledAt(item.scheduled_at, date) })
    }
  }

  function selectBlock(block: CalendarBlock) {
    if (selected === block.key) {
      setSelected(null)
      setPopoverId(null)
      return
    }
    setSelected(block.key)
    setPopoverId(block.source.type === 'card' ? block.source.id : null)
  }

  return (
    <section>
      {(cards.error || items.error) && (
        <p role="alert" className="mb-3 rounded-xl bg-danger/15 px-3 py-2 text-sm font-medium text-danger">
          {tc('saveFailed')}
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <IconButton label={t('prev')} onClick={() => setView((v) => shift(v, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </IconButton>
        <h2 className="min-w-[8rem] text-center text-lg font-extrabold tracking-tight" aria-live="polite">
          {format.dateTime(new Date(Date.UTC(view.year, view.month - 1, 15)), {
            year: 'numeric',
            month: 'long',
            timeZone: 'UTC',
          })}
        </h2>
        <IconButton label={t('next')} onClick={() => setView((v) => shift(v, 1))}>
          <ChevronRight className="h-4 w-4" />
        </IconButton>
        <Button variant="ghost" size="sm" magnetic={false} onClick={() => setView(monthOf(today))}>
          {t('today')}
        </Button>
      </div>
      <p className="mb-3 text-sm text-muted">{t('hint')}</p>

      {/* 폰에서는 그리드만 가로로 스크롤한다 */}
      <div className="overflow-x-auto rounded-2xl border border-line">
        <div className="grid min-w-[44rem] grid-cols-7 gap-px bg-line">
          {grid.slice(0, 7).map((date) => (
            <div key={`h-${date}`} className="bg-ink px-2 py-1.5 text-xs font-bold text-muted">
              {format.dateTime(new Date(`${date}T12:00:00Z`), { weekday: 'short', timeZone: 'UTC' })}
            </div>
          ))}
          {grid.map((date) => (
            <DayCell
              key={date}
              date={date}
              inMonth={date.startsWith(monthPrefix)}
              isToday={date === today}
              blocks={byDay.get(date) ?? []}
              selectedKey={selected}
              onSelectBlock={selectBlock}
              onDropToken={(token) => moveTo(token, date)}
              onPickDay={() => {
                if (selected) moveTo(selected, date)
              }}
              onAdd={() => setAddingOn(date)}
            />
          ))}
        </div>
      </div>

      {undated.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-bold">
            {t('undated')} <span className="opacity-60">{undated.length}</span>
          </h3>
          <ul className="flex flex-wrap gap-2">
            {undated.map((card) => {
              const token = `${UNDATED}${card.id}`
              return (
                <li
                  key={card.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_TYPE, token)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelected((cur) => (cur === token ? null : token))}
                    aria-pressed={selected === token}
                    className={`max-w-[16rem] cursor-grab truncate rounded-full px-3 py-1 text-xs font-semibold active:cursor-grabbing ${
                      KIND_CLASS.upload
                    } ${selected === token ? 'outline-2 outline-offset-2 outline-cream' : ''}`}
                  >
                    {card.title}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {popoverCard && (
        <CardDatePopover
          card={popoverCard}
          platform={platform}
          onUpdate={(patch) => void updateCard(popoverCard, patch)}
          onClose={() => setPopoverId(null)}
        />
      )}

      {addingOn && (
        <EventForm
          date={addingOn}
          onClose={() => setAddingOn(null)}
          onAdd={(row) => {
            setAddingOn(null)
            void items.mutate({ type: 'INSERT', row }, () => scheduleData.insert(row))
          }}
        />
      )}
    </section>
  )
}

/** 기타 일정 추가 폼. 시각은 그 날짜의 한국 시간으로 받는다. */
function EventForm({
  date,
  onClose,
  onAdd,
}: {
  date: string
  onClose: () => void
  onAdd: (row: ScheduleItem) => void
}) {
  const t = useTranslations('calendar')
  const ts = useTranslations('schedule')
  const tc = useTranslations('common')
  const workspaceId = useWorkspaceId()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<ScheduleKind>('upload')
  const [time, setTime] = useState(DEFAULT_TIME)

  function submit(e: FormEvent) {
    e.preventDefault()
    const parsed = textSchema.safeParse(title)
    if (!parsed.success || !time) return
    onAdd({
      id: newId(),
      workspace_id: workspaceId,
      title: parsed.data,
      kind,
      scheduled_at: seoulTimeAt(date, time),
      is_done: false,
      created_at: new Date().toISOString(),
    })
  }

  return (
    <FloatingPanel title={`${t('add')} · ${date}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <input
          aria-label={ts('titleLabel')}
          placeholder={ts('titleLabel')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className={fieldClass}
        />
        <div className="flex gap-2">
          <select
            aria-label={ts('kindLabel')}
            value={kind}
            onChange={(e) => setKind(e.target.value as ScheduleKind)}
            className={`${selectClass} flex-1`}
          >
            {SCHEDULE_KINDS.map((k) => (
              <option key={k} value={k}>
                {ts(`kinds.${k}`)}
              </option>
            ))}
          </select>
          <input
            type="time"
            aria-label={ts('whenLabel')}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className={fieldClass}
          />
        </div>
        <Button type="submit" size="sm" variant="ink" className="self-end">
          {tc('add')}
        </Button>
      </form>
    </FloatingPanel>
  )
}
