import { describe, expect, it } from 'vitest'
import { capPerChannel, rankCandidates } from './rankCandidates'
import type { ScoredVideo } from './scoreVideo'

const s = (videoId: string, channelId: string, matched: string[] = ['storytelling'], relevance = 4): ScoredVideo => ({
  videoId,
  title: videoId,
  channelId,
  channelTitle: channelId,
  viewCount: 0,
  thumbnailUrl: '',
  durationSec: 600,
  categoryId: '22',
  publishedAt: '2026-10-20T00:00:00Z',
  tags: [],
  description: '',
  matched,
  relevance,
})
const groups: Record<string, string> = { 'living alone': 'solo', alone: 'solo', storytelling: 'story', habits: 'habit' }
const groupOf = (k: string) => groups[k] ?? k
const ids = (list: { videoId: string }[]) => list.map((v) => v.videoId)

describe('capPerChannel', () => {
  it('keeps the first videos of each channel up to the limit', () => {
    expect(ids(capPerChannel([s('a1', 'A'), s('a2', 'A'), s('b1', 'B'), s('a3', 'A')]))).toEqual(['a1', 'a2', 'b1'])
  })
})

describe('rankCandidates', () => {
  it('moves recently shown channel videos to the back instead of dropping them', () => {
    const { channel } = rankCandidates({
      channel: [s('seen', 'A'), s('fresh', 'B')],
      keyword: [],
      recent: ['seen'],
      groupOf,
    })
    expect(ids(channel)).toEqual(['fresh', 'seen'])
  })

  it('applies the per-channel cap after deferring shown videos', () => {
    const { channel } = rankCandidates({
      channel: [s('a1', 'A'), s('a2', 'A'), s('a3', 'A'), s('a4', 'A')],
      keyword: [],
      recent: ['a1', 'a2'],
      groupOf,
    })
    expect(ids(channel)).toEqual(['a3', 'a4'])
  })

  it('mixes topics among unseen channel videos before seen ones', () => {
    const { channel } = rankCandidates({
      channel: [
        s('solo1', 'A', ['living alone'], 6),
        s('solo2', 'B', ['alone'], 5),
        s('story', 'C', ['storytelling'], 3),
        s('seenHabit', 'D', ['habits'], 9),
      ],
      keyword: [],
      recent: ['seenHabit'],
      groupOf,
    })
    expect(ids(channel)).toEqual(['solo1', 'story', 'solo2', 'seenHabit'])
  })

  it('drops recently shown keyword videos and mixes topics', () => {
    const { keyword } = rankCandidates({
      channel: [],
      keyword: [s('k0', 'X', ['living alone'], 6), s('k1', 'Y', ['alone'], 5), s('old', 'Z'), s('k2', 'W', ['habits'], 4)],
      recent: ['old'],
      groupOf,
    })
    expect(ids(keyword)).toEqual(['k0', 'k2', 'k1'])
  })

  it('falls back to all keyword videos when nothing else is left', () => {
    const { keyword } = rankCandidates({ channel: [], keyword: [s('k0', 'X')], recent: ['k0'], groupOf })
    expect(ids(keyword)).toEqual(['k0'])
  })
})
