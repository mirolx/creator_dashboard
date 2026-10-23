import { describe, expect, it } from 'vitest'
import { isPublicPath } from './paths'

describe('isPublicPath', () => {
  it('allows the login page and auth routes', () => {
    expect(isPublicPath('/login')).toBe(true)
    expect(isPublicPath('/auth/callback')).toBe(true)
  })

  it('lets cron routes through (they check CRON_SECRET themselves)', () => {
    expect(isPublicPath('/api/cron/trends')).toBe(true)
    expect(isPublicPath('/api/other')).toBe(false)
  })

  it('protects everything else', () => {
    expect(isPublicPath('/')).toBe(false)
    expect(isPublicPath('/youtube')).toBe(false)
    expect(isPublicPath('/loginx')).toBe(false)
    expect(isPublicPath('/authors')).toBe(false)
  })
})
