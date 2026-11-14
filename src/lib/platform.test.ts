import { describe, expect, it } from 'vitest'
import { platformFromPath, sectionFromPath } from './platform'

describe('platformFromPath', () => {
  it('reads the first path segment', () => {
    expect(platformFromPath('/youtube')).toBe('youtube')
    expect(platformFromPath('/instagram/settings')).toBe('instagram')
  })

  it('returns null outside a workspace', () => {
    expect(platformFromPath('/login')).toBeNull()
    expect(platformFromPath('/')).toBeNull()
    expect(platformFromPath('')).toBeNull()
  })
})

describe('sectionFromPath', () => {
  it('maps the second segment to a section', () => {
    expect(sectionFromPath('/youtube')).toBe('')
    expect(sectionFromPath('/instagram/calendar')).toBe('calendar')
    expect(sectionFromPath('/youtube/settings')).toBe('settings')
  })

  it('falls back to home for unknown sections', () => {
    expect(sectionFromPath('/youtube/unknown')).toBe('')
  })
})
