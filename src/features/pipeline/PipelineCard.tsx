'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EditableText } from '@/components/EditableText'
import { Button, IconButton } from '@/components/ui/button'
import { fieldClass, selectClass } from '@/components/ui/field'
import { nextDue } from '@/lib/pipeline'
import { CARD_DATE_FIELDS, KANBAN_STATUSES, type KanbanCard, type KanbanStatus } from '@/lib/types'
import { NotionButton } from './NotionButton'

export function PipelineCard({
  card,
  today,
  syncFailed,
  onUpdate,
  onMove,
  onDelete,
  onRetrySync,
}: {
  card: KanbanCard
  /** 한국 시간 기준 오늘 (YYYY-MM-DD) */
  today: string
  syncFailed: boolean
  onUpdate: (patch: Partial<KanbanCard>) => Promise<boolean>
  /** 단계 드롭다운으로 다른 칸 끝으로 옮긴다 */
  onMove: (status: KanbanStatus) => void
  onDelete: () => void
  onRetrySync: () => void
}) {
  const t = useTranslations('pipeline')
  const tc = useTranslations('common')
  const [expanded, setExpanded] = useState(false)
  const due = nextDue(card, today)

  return (
    <div className="flex flex-col gap-2">
      <EditableText
        label={t('cardLabel')}
        value={card.title}
        onSave={(v) => onUpdate({ title: v })}
        className="w-full text-sm font-semibold"
      />

      {due && (
        <span className="self-start rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-accent">
          {due.days === 0
            ? t('dueToday', { label: t(`dates.${due.field}`) })
            : t('due', { label: t(`dates.${due.field}`), days: due.days })}
        </span>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <select
          aria-label={t('stage')}
          value={card.status}
          onChange={(e) => onMove(e.target.value as KanbanStatus)}
          className={`${selectClass} h-8 py-0 text-xs`}
        >
          {KANBAN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`statuses.${s}`)}
            </option>
          ))}
        </select>
        <NotionButton card={card} />
        <IconButton
          label={expanded ? t('collapse') : t('expand')}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </IconButton>
      </div>

      {syncFailed && (
        <button
          type="button"
          onClick={onRetrySync}
          className="self-start text-[11px] font-medium text-danger underline"
        >
          {t('notionSyncFailed')}
        </button>
      )}

      {expanded && (
        <div className="flex flex-col gap-2 border-t border-current/15 pt-2">
          {CARD_DATE_FIELDS.map((field) => (
            <label key={field} className="flex items-center justify-between gap-2 text-xs font-medium">
              {t(`dates.${field}`)}
              <input
                type="date"
                value={card[field] ?? ''}
                onChange={(e) => void onUpdate({ [field]: e.target.value || null })}
                className={`${fieldClass} h-8 py-0 text-xs`}
              />
            </label>
          ))}
          <div className="flex items-center gap-1">
            {card.status === 'published' && (
              <Button
                variant="ink"
                size="sm"
                magnetic={false}
                onClick={() => void onUpdate({ archived_at: new Date().toISOString() })}
              >
                {t('archive')}
              </Button>
            )}
            <Button variant="danger" size="sm" magnetic={false} onClick={onDelete} className="ml-auto">
              {tc('delete')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
