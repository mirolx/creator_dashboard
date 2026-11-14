import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PipelineBoard } from '@/features/pipeline/PipelineBoard'
import { listRows } from '@/lib/dashboard'
import { WorkspaceRealtime } from '@/lib/realtime/WorkspaceRealtime'
import { isPlatform, type KanbanCard } from '@/lib/types'
import { getWorkspace } from '@/lib/workspace'

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ platform: string }>
}) {
  const { platform } = await params
  if (!isPlatform(platform)) notFound()
  const workspace = await getWorkspace(platform)
  if (!workspace) notFound()

  const [cards, t] = await Promise.all([
    listRows<KanbanCard>(workspace.id, 'kanban_cards'),
    getTranslations('pipeline'),
  ])

  return (
    <WorkspaceRealtime key={workspace.id} workspaceId={workspace.id}>
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl">{t('title')}</h1>
      <PipelineBoard initial={cards} />
    </WorkspaceRealtime>
  )
}
