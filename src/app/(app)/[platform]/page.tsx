import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { ChecklistWidget } from '@/features/checklist/ChecklistWidget'
import { StageSummary } from '@/features/home/StageSummary'
import { WeekAgenda } from '@/features/home/WeekAgenda'
import { seoulDateString } from '@/lib/dates'
import { listRows } from '@/lib/dashboard'
import { WorkspaceRealtime } from '@/lib/realtime/WorkspaceRealtime'
import { isPlatform, type ChecklistItem, type KanbanCard, type ScheduleItem } from '@/lib/types'
import { getWorkspace } from '@/lib/workspace'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ platform: string }>
}) {
  const { platform } = await params
  if (!isPlatform(platform)) notFound()
  const workspace = await getWorkspace(platform)
  if (!workspace) notFound()

  const [schedule, checklist, cards, t] = await Promise.all([
    listRows<ScheduleItem>(workspace.id, 'schedule_items'),
    listRows<ChecklistItem>(workspace.id, 'checklist_items'),
    listRows<KanbanCard>(workspace.id, 'kanban_cards'),
    getTranslations(),
  ])

  const today = seoulDateString(new Date())

  return (
    // key: 탭을 바꾸면 위젯 상태를 새 워크스페이스로 완전히 초기화한다.
    <WorkspaceRealtime key={workspace.id} workspaceId={workspace.id}>
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl">{workspace.name}</h1>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="md:col-span-7">
          <WeekAgenda platform={platform} today={today} initialCards={cards} initialItems={schedule} />
        </div>
        <div className="md:col-span-5">
          <ChecklistWidget initial={checklist} />
        </div>
        <div className="md:col-span-12">
          <StageSummary platform={platform} initialCards={cards} />
        </div>
        <div className="md:col-span-12">
          <Card title={t('performance.title')} tone="accent">
            <p className="text-sm font-medium opacity-75">{t('performance.comingSoon')}</p>
          </Card>
        </div>
      </div>
    </WorkspaceRealtime>
  )
}
