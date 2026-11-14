import { isPlatform, type Platform } from '@/lib/types'

/** "/youtube/settings" → "youtube". 워크스페이스 밖이면 null. */
export function platformFromPath(pathname: string): Platform | null {
  const first = pathname.split('/')[1] ?? ''
  return isPlatform(first) ? first : null
}

export const SECTIONS = ['', 'calendar', 'pipeline', 'explore', 'archive', 'settings'] as const
export type Section = (typeof SECTIONS)[number]

/** "/youtube/calendar" → "calendar", "/youtube" → "". 모르는 값이면 "". */
export function sectionFromPath(pathname: string): Section {
  const second = pathname.split('/')[2] ?? ''
  return (SECTIONS as readonly string[]).includes(second) ? (second as Section) : ''
}
