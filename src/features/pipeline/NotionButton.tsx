'use client'

import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { KanbanCard } from '@/lib/types'
import { openNotionPage } from './notionActions'
import { notionErrorKey } from './notionErrors'

export function NotionButton({ card }: { card: KanbanCard }) {
  const t = useTranslations('pipeline.notion')
  const [pending, setPending] = useState(false)
  const [errorKey, setErrorKey] = useState<ReturnType<typeof notionErrorKey> | null>(null)

  async function open() {
    // 팝업 차단을 피하려고 클릭 즉시 빈 탭을 연 뒤 주소를 채운다.
    const tab = window.open('', '_blank')
    if (tab) tab.opener = null
    setPending(true)
    setErrorKey(null)
    try {
      const result = await openNotionPage(card.id)
      if ('url' in result) {
        if (tab) tab.location.href = result.url
        else window.open(result.url, '_blank')
      } else {
        tab?.close()
        setErrorKey(notionErrorKey(result.error))
      }
    } catch {
      tab?.close()
      setErrorKey('failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button variant="ink" size="sm" magnetic={false} disabled={pending} onClick={open}>
        <FileText className="h-3.5 w-3.5" />
        {pending ? t('creating') : card.notion_url ? t('open') : `+ ${t('open')}`}
      </Button>
      {errorKey && (
        <span role="alert" className="inline-flex items-center gap-1 text-[11px] text-danger">
          {t(errorKey)}
          <button type="button" onClick={open} className="underline">
            {t('retry')}
          </button>
        </span>
      )}
    </span>
  )
}
