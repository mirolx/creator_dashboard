'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { isActive } from '@/lib/pipeline'
import { useLiveList } from '@/lib/realtime/useLiveList'
import { KANBAN_STATUSES, type KanbanCard, type Platform } from '@/lib/types'
import { byPosition } from '@/features/pipeline/data'

export function StageSummary({
  platform,
  initialCards,
}: {
  platform: Platform
  initialCards: KanbanCard[]
}) {
  const t = useTranslations('home')
  const ts = useTranslations('pipeline.statuses')
  const { rows } = useLiveList('kanban_cards', initialCards, byPosition)
  const active = rows.filter(isActive)

  return (
    <Card
      title={t('stagesTitle')}
      tone="dark"
      action={
        <Link
          href={`/${platform}/pipeline`}
          className="shrink-0 text-xs font-semibold text-accent underline underline-offset-2"
        >
          {t('openPipeline')}
        </Link>
      }
    >
      <ul className="grid grid-cols-5 gap-2">
        {KANBAN_STATUSES.map((status) => (
          <li key={status}>
            <Link
              href={`/${platform}/pipeline`}
              className="flex flex-col items-center gap-1 rounded-xl border border-line px-1 py-3 text-center hover:border-accent"
            >
              <span className="text-2xl font-extrabold">
                {active.filter((c) => c.status === status).length}
              </span>
              <span className="text-[11px] font-medium opacity-75">{ts(status)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
