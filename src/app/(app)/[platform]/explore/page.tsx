import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { MemoWidget } from '@/features/memo/MemoWidget'
import { PinnedIdeasWidget } from '@/features/ideas/PinnedIdeasWidget'
import { TrendsSection } from '@/features/trends/TrendsSection'
import { listRows } from '@/lib/dashboard'
import { WorkspaceRealtime } from '@/lib/realtime/WorkspaceRealtime'
import { isPlatform, type PinnedIdea } from '@/lib/types'
import { getWorkspace } from '@/lib/workspace'

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ platform: string }>
}) {
  const { platform } = await params
  if (!isPlatform(platform)) notFound()
  const workspace = await getWorkspace(platform)
  if (!workspace) notFound()

  const [ideas, t] = await Promise.all([
    listRows<PinnedIdea>(workspace.id, 'pinned_ideas'),
    getTranslations(),
  ])
  const isYouTube = platform === 'youtube'

  return (
    <WorkspaceRealtime key={workspace.id} workspaceId={workspace.id}>
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl">
        {t('dashboard.explore')}
      </h1>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
        {isYouTube && (
          <div className="md:col-span-12">
            <Suspense
              fallback={
                <Card title={t('trends.title')} tone="cream">
                  <p className="text-sm opacity-75">{t('trends.loading')}</p>
                </Card>
              }
            >
              <TrendsSection workspaceId={workspace.id} />
            </Suspense>
          </div>
        )}
        {/* 고정된 아이디어는 트렌드 아래에 전체 폭으로 둬서 여러 열로 펼친다 */}
        <div className="md:col-span-12">
          <PinnedIdeasWidget initial={ideas} />
        </div>
        <div className="md:col-span-12">
          <MemoWidget initialMemo={workspace.memo} />
        </div>
      </div>
    </WorkspaceRealtime>
  )
}
