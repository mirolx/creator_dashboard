import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { ChecklistWidget } from '@/features/checklist/ChecklistWidget'
import { ScheduleWidget } from '@/features/schedule/ScheduleWidget'
import { listRows } from '@/lib/dashboard'
import { WorkspaceRealtime } from '@/lib/realtime/WorkspaceRealtime'
import { isPlatform, type ChecklistItem, type ScheduleItem } from '@/lib/types'
import { getWorkspace } from '@/lib/workspace'

const sectionClass = 'mt-4 text-xs font-semibold uppercase tracking-widest text-muted md:col-span-12'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ platform: string }>
}) {
  const { platform } = await params
  if (!isPlatform(platform)) notFound()
  const workspace = await getWorkspace(platform)
  if (!workspace) notFound()

  const [schedule, checklist, t] = await Promise.all([
    listRows<ScheduleItem>(workspace.id, 'schedule_items'),
    listRows<ChecklistItem>(workspace.id, 'checklist_items'),
    getTranslations(),
  ])

  return (
    // key: 탭을 바꾸면 위젯 상태를 새 워크스페이스로 완전히 초기화한다.
    <WorkspaceRealtime key={workspace.id} workspaceId={workspace.id}>
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl">{workspace.name}</h1>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
        <h2 className={sectionClass}>{t('dashboard.today')}</h2>
        <div className="md:col-span-7">
          <ScheduleWidget initial={schedule} />
        </div>
        <div className="md:col-span-5">
          <ChecklistWidget initial={checklist} />
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
