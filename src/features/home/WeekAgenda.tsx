'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { toCalendarBlocks, weekDates } from '@/lib/calendar'
import { useLiveList } from '@/lib/realtime/useLiveList'
import type { KanbanCard, Platform, ScheduleItem } from '@/lib/types'
import { byPosition } from '@/features/pipeline/data'

// DB(+00:00)와 클라이언트(Z)의 ISO 표기가 달라 문자열이 아닌 시각으로 비교한다.
const byDate = (a: ScheduleItem, b: ScheduleItem) =>
  new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()

export function WeekAgenda({
  platform,
  today,
  initialCards,
  initialItems,
}: {
  platform: Platform
  /** 서버에서 계산한 서울 기준 오늘(YYYY-MM-DD) — 하이드레이션 불일치 방지 */
  today: string
  initialCards: KanbanCard[]
  initialItems: ScheduleItem[]
}) {
  const t = useTranslations('home')
  const tk = useTranslations('calendar.kinds')
  const format = useFormatter()
  const cards = useLiveList('kanban_cards', initialCards, byPosition)
  const items = useLiveList('schedule_items', initialItems, byDate)

  const days = useMemo(() => {
    const blocks = toCalendarBlocks(cards.rows, items.rows)
    return weekDates(today).map((date) => ({
      date,
      blocks: blocks.filter((b) => b.date === date),
    }))
  }, [cards.rows, items.rows, today])

  return (
    <Card
      title={t('weekTitle')}
      tone="cream"
      action={
        <Link
          href={`/${platform}/calendar`}
          className="shrink-0 text-xs font-semibold underline underline-offset-2"
        >
          {t('openCalendar')}
        </Link>
      }
    >
      <ul className="flex flex-col gap-2">
        {days.map(({ date, blocks }) => (
          <li key={date} className="flex gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold opacity-70">
              {format.dateTime(new Date(`${date}T00:00:00Z`), {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
                timeZone: 'UTC',
              })}
            </span>
            {blocks.length === 0 ? (
              <span className="text-sm opacity-50">{t('empty')}</span>
            ) : (
              <ul className="flex min-w-0 flex-1 flex-col gap-1">
                {blocks.map((block) => {
                  const body = (
                    <>
                      <span className="opacity-70">{tk(block.kind)}</span> {block.title}
                    </>
                  )
                  const cls = `block truncate text-sm font-medium ${
                    block.done ? 'line-through opacity-50' : ''
                  } ${block.archived ? 'opacity-50' : ''}`
                  return (
                    <li key={block.key}>
                      {block.source.type === 'card' ? (
                        <Link href={`/${platform}/pipeline`} className={`${cls} hover:underline`}>
                          {body}
                        </Link>
                      ) : (
                        <span className={cls}>{body}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
