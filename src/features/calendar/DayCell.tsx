'use client'

import { useState, type DragEvent } from 'react'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CalendarBlock, CalendarKind } from '@/lib/calendar'

export const DRAG_TYPE = 'text/plain'

export const KIND_CLASS: Record<CalendarKind, string> = {
  shoot: 'bg-cream text-ink',
  edit: 'bg-danger text-ink',
  upload: 'bg-accent text-ink',
  event: 'border border-current/40',
}

export function DayCell({
  date,
  inMonth,
  isToday,
  blocks,
  selectedKey,
  onSelectBlock,
  onDropToken,
  onPickDay,
  onAdd,
}: {
  date: string
  inMonth: boolean
  isToday: boolean
  blocks: CalendarBlock[]
  selectedKey: string | null
  onSelectBlock: (block: CalendarBlock) => void
  /** 끌어 놓은 블록(또는 날짜 없는 카드)의 토큰 */
  onDropToken: (token: string) => void
  /** 빈 곳을 눌렀을 때: 고른 블록이 있으면 이 날짜로 옮긴다 */
  onPickDay: () => void
  onAdd: () => void
}) {
  const t = useTranslations('calendar')
  const [over, setOver] = useState(false)
  const day = Number(date.slice(8))

  function drop(e: DragEvent) {
    e.preventDefault()
    setOver(false)
    const token = e.dataTransfer.getData(DRAG_TYPE)
    if (token) onDropToken(token)
  }

  return (
    <div
      onClick={onPickDay}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (!over) setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false)
      }}
      onDrop={drop}
      className={`flex min-h-24 min-w-0 flex-col gap-1 border-line p-1.5 transition-shadow ${
        inMonth ? 'bg-panel' : 'bg-ink/60 text-muted'
      } ${over ? 'ring-2 ring-inset ring-accent' : ''} ${selectedKey ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        {/* 키보드로도 고른 블록을 이 날짜로 옮길 수 있게 날짜 숫자를 버튼으로 둔다 */}
        <button
          type="button"
          aria-label={date}
          aria-current={isToday ? 'date' : undefined}
          onClick={(e) => {
            e.stopPropagation()
            onPickDay()
          }}
          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-bold ${
            isToday ? 'bg-accent text-ink' : ''
          }`}
        >
          {day}
        </button>
        <button
          type="button"
          aria-label={`${t('add')} ${date}`}
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full opacity-50 transition hover:bg-cream/10 hover:opacity-100 focus-visible:opacity-100"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {blocks.map((block) => (
          // Firefox는 <button>에서 끌기를 시작하지 않아 li에 draggable을 둔다.
          <li
            key={block.key}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_TYPE, block.key)
              e.dataTransfer.effectAllowed = 'move'
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelectBlock(block)
              }}
              aria-pressed={selectedKey === block.key}
              title={`${t(`kinds.${block.kind}`)} · ${block.title}`}
              className={`block w-full cursor-grab truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold active:cursor-grabbing ${
                KIND_CLASS[block.kind]
              } ${block.archived ? 'opacity-50' : ''} ${
                selectedKey === block.key ? 'outline-2 outline-offset-1 outline-cream' : ''
              }`}
            >
              <span className="opacity-70">{t(`kinds.${block.kind}`)}</span> {block.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
