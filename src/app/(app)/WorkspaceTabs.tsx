'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PillTabs } from '@/components/ui/pill-tabs'
import { platformFromPath, sectionFromPath } from '@/lib/platform'
import { PLATFORMS } from '@/lib/types'

/** 플랫폼 전환 탭. 현재 섹션을 유지한 채 플랫폼만 바꾼다. */
export function WorkspaceTabs() {
  const t = useTranslations('nav')
  const pathname = usePathname() ?? ''
  const current = platformFromPath(pathname)
  const section = sectionFromPath(pathname)

  const items = PLATFORMS.map((p) => ({
    href: section ? `/${p}/${section}` : `/${p}`,
    label: t(p),
    active: current === p,
  }))
  return <PillTabs items={items} />
}
