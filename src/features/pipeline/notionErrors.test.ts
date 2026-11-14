import { describe, expect, it } from 'vitest'
import { notionErrorKey } from './notionErrors'

describe('notionErrorKey', () => {
  it('maps each code to a message key', () => {
    expect(notionErrorKey('missing-config')).toBe('missingConfig')
    expect(notionErrorKey('unauthorized')).toBe('unauthorized')
    expect(notionErrorKey('not-found')).toBe('notFound')
    expect(notionErrorKey('failed')).toBe('failed')
    expect(notionErrorKey('invalid')).toBe('failed')
  })
})
