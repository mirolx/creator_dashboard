'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { ScheduleItem } from '@/lib/types'
import { FloatingPanel } from './CardDatePopover'

/** 기타 일정 블록을 눌렀을 때 뜨는 패널: 시각, 완료 표시, 삭제 */
export function EventPopover({
  item,
  onToggleDone,
  onDelete,
  onClose,
}: {
  item: ScheduleItem
  onToggleDone: (done: boolean) => void
  onDelete: () => void
  onClose: () => void
}) {
  const t = useTranslations('calendar')
  const ts = useTranslations('schedule')
  const format = useFormatter()

  return (
    <FloatingPanel title={item.title} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold opacity-70">
          {ts(`kinds.${item.kind}`)} ·{' '}
          {format.dateTime(new Date(item.scheduled_at), {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Seoul',
          })}
        </p>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={item.is_done}
              onChange={(e) => onToggleDone(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            {t('eventDone')}
          </label>
          <Button
            variant="danger"
            size="sm"
            magnetic={false}
            onClick={() => {
              if (window.confirm(t('deleteConfirm'))) onDelete()
            }}
            className="ml-auto"
          >
            {t('deleteEvent')}
          </Button>
        </div>
      </div>
    </FloatingPanel>
  )
}
