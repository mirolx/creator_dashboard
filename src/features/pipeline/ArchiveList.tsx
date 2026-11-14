'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { sortArchived, unarchivePatch } from '@/lib/archive'
import { isActive } from '@/lib/pipeline'
import { useLiveList } from '@/lib/realtime/useLiveList'
import type { KanbanCard } from '@/lib/types'
import { byPosition, kanbanData } from './data'
import { NotionButton } from './NotionButton'

export function ArchiveList({ initial }: { initial: KanbanCard[] }) {
  const t = useTranslations('pipeline')
  const tc = useTranslations('common')
  const { rows, mutate, error } = useLiveList('kanban_cards', initial, byPosition)
  const archived = sortArchived(rows.filter((c) => !isActive(c)))

  function unarchive(card: KanbanCard) {
    const patch = unarchivePatch(rows)
    void mutate({ type: 'UPDATE', row: { ...card, ...patch } }, () => kanbanData.update(card.id, patch))
  }

  function remove(card: KanbanCard) {
    if (!window.confirm(t('deleteConfirm'))) return
    void mutate({ type: 'DELETE', id: card.id }, () => kanbanData.remove(card.id))
  }

  return (
    <section>
      {error && (
        <p role="alert" className="mb-3 rounded-xl bg-danger/15 px-3 py-2 text-sm font-medium text-danger">
          {tc('saveFailed')}
        </p>
      )}
      {archived.length === 0 ? (
        <p className="text-sm opacity-60">{t('archiveEmpty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {archived.map((card) => (
            <li
              key={card.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-cream px-4 py-3 text-ink"
            >
              <span className="min-w-0 flex-1 basis-48 break-words text-sm font-semibold">{card.title}</span>
              <span className="text-xs tabular-nums opacity-70">
                {card.upload_on ? `${t('dates.upload_on')} ${card.upload_on}` : t('noUploadDate')}
              </span>
              <div className="flex items-center gap-1">
                <NotionButton card={card} />
                <Button variant="ghost" size="sm" magnetic={false} onClick={() => unarchive(card)}>
                  {t('unarchive')}
                </Button>
                <Button variant="danger" size="sm" magnetic={false} onClick={() => remove(card)}>
                  {tc('delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
