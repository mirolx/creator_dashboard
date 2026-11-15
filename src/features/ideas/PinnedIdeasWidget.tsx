'use client'

import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EditableText } from '@/components/EditableText'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { fieldClass } from '@/components/ui/field'
import { RequiredHint, useRequiredHint } from '@/components/ui/required-hint'
import { newId } from '@/lib/id'
import { useLiveList } from '@/lib/realtime/useLiveList'
import { useWorkspaceId } from '@/lib/realtime/WorkspaceRealtime'
import type { PinnedIdea } from '@/lib/types'
import { textSchema } from '@/lib/validation'
import { ideasData } from './data'

const byNewest = (a: PinnedIdea, b: PinnedIdea) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

export function PinnedIdeasWidget({ initial }: { initial: PinnedIdea[] }) {
  const t = useTranslations('ideas')
  const tc = useTranslations('common')
  const workspaceId = useWorkspaceId()
  const { rows, mutate, error } = useLiveList('pinned_ideas', initial, byNewest)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const required = useRequiredHint()

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parsed = textSchema.safeParse(title)
    if (!parsed.success) return required.reject(e)
    const row: PinnedIdea = {
      id: newId(),
      workspace_id: workspaceId,
      title: parsed.data,
      note: note.trim(),
      source_url: null,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
    }
    setTitle('')
    setNote('')
    void mutate({ type: 'INSERT', row }, () => ideasData.insert(row))
  }

  function update(row: PinnedIdea, patch: Partial<PinnedIdea>) {
    return mutate({ type: 'UPDATE', row: { ...row, ...patch } }, () =>
      ideasData.update(row.id, patch),
    )
  }

  return (
    <Card title={t('title')} tone="dark" error={error ? tc('saveFailed') : null}>
      {/* 넓은 화면에서는 제목·메모·추가를 한 줄에 둔다 */}
      <form onSubmit={add} className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          aria-label={t('titleLabel')}
          placeholder={t('titleLabel')}
          value={title}
          aria-invalid={required.missing || undefined}
          onChange={(e) => {
            setTitle(e.target.value)
            required.clear()
          }}
          className={`${fieldClass} min-w-0 sm:flex-1`}
        />
        <div className="flex gap-2 sm:flex-1">
          <input
            aria-label={t('noteLabel')}
            placeholder={t('noteLabel')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${fieldClass} min-w-0 flex-1`}
          />
          <Button type="submit" size="sm">
            {tc('add')}
          </Button>
        </div>
      </form>
      <RequiredHint show={required.missing} className="-mt-1 mb-3" />

      {rows.length === 0 ? (
        <p className="text-sm opacity-60">{t('empty')}</p>
      ) : (
        // 아이디어가 많아도 스크롤이 짧도록 여러 열로 놓고, 삭제는 작은 아이콘으로 제목 옆에 둔다.
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {rows.map((row) => (
            <li key={row.id} className="flex gap-2 rounded-2xl border border-current/15 p-2.5">
              {row.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.thumbnail_url} alt="" className="h-10 w-16 shrink-0 rounded-lg object-cover" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-start gap-1">
                  <EditableText
                    label={t('titleLabel')}
                    value={row.title}
                    onSave={(v) => update(row, { title: v })}
                    className="min-w-0 flex-1 text-sm font-medium"
                  />
                  <IconButton
                    label={tc('delete')}
                    onClick={() =>
                      void mutate({ type: 'DELETE', id: row.id }, () => ideasData.remove(row.id))
                    }
                    className="h-6 w-6 border-transparent opacity-60 hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
                {row.note && <p className="line-clamp-2 text-xs opacity-60">{row.note}</p>}
                {row.source_url && (
                  <a
                    href={row.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="self-start text-xs underline underline-offset-2"
                  >
                    {t('source')}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
