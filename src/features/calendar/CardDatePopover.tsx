'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { IconButton } from '@/components/ui/button'
import { fieldClass } from '@/components/ui/field'
import { CARD_DATE_FIELDS, type KanbanCard, type Platform } from '@/lib/types'

/** 화면 아래쪽에 뜨는 작은 패널. Escape나 바깥 누름으로 닫힌다. */
export function FloatingPanel({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const t = useTranslations('calendar')
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-sm rounded-[20px] bg-cream p-4 text-ink shadow-2xl"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-base font-extrabold tracking-tight">{title}</h3>
        <IconButton label={t('close')} onClick={onClose}>
          <X className="h-4 w-4" />
        </IconButton>
      </div>
      {children}
    </div>
  )
}

export function CardDatePopover({
  card,
  platform,
  onUpdate,
  onClose,
}: {
  card: KanbanCard
  platform: Platform
  onUpdate: (patch: Partial<KanbanCard>) => void
  onClose: () => void
}) {
  const t = useTranslations('calendar')
  const tp = useTranslations('pipeline')

  return (
    <FloatingPanel title={card.title} onClose={onClose}>
      <div className="flex flex-col gap-2">
        {CARD_DATE_FIELDS.map((field) => (
          <label key={field} className="flex items-center justify-between gap-2 text-xs font-medium">
            {tp(`dates.${field}`)}
            <input
              type="date"
              value={card[field] ?? ''}
              onChange={(e) => onUpdate({ [field]: e.target.value || null })}
              className={`${fieldClass} h-8 py-0 text-xs`}
            />
          </label>
        ))}
        <Link
          href={`/${platform}/pipeline`}
          className="mt-1 self-start text-xs font-semibold underline underline-offset-2"
        >
          {t('openPipeline')}
        </Link>
      </div>
    </FloatingPanel>
  )
}
