'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PillTabs } from '@/components/ui/pill-tabs'
import { platformFromPath, SECTIONS, sectionFromPath } from '@/lib/platform'

const LABEL_KEY = {
  '': 'home',
  calendar: 'calendar',
  pipeline: 'pipeline',
  explore: 'explore',
  archive: 'archive',
  settings: 'settings',
} as const

/** 워크스페이스 안의 섹션 메뉴. 워크스페이스 밖에서는 그리지 않는다. */
export function MenuTabs() {
  const t = useTranslations('nav')
  const pathname = usePathname() ?? ''
  const platform = platformFromPath(pathname)
  if (!platform) return null
  const current = sectionFromPath(pathname)

  const items = SECTIONS.map((s) => ({
    href: s ? `/${platform}/${s}` : `/${platform}`,
    label: t(LABEL_KEY[s]),
    active: current === s,
  }))
  return <PillTabs items={items} />
}
