import { describe, expect, it } from 'vitest'
import { capPerChannel, lastShownDates, rankCandidates } from './rankCandidates'
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
const shown = (...videoIds: string[]) => new Map(videoIds.map((id): [string, string] => [id, '2026-10-20']))

describe('capPerChannel', () => {
  it('keeps the first videos of each channel up to the limit', () => {
    expect(ids(capPerChannel([s('a1', 'A'), s('a2', 'A'), s('b1', 'B'), s('a3', 'A')]))).toEqual(['a1', 'a2', 'b1'])
  })
})

describe('lastShownDates', () => {
  it('keeps the latest date of each video', () => {
    const rows = [
      { video_id: 'a', fetched_on: '2026-10-20' },
      { video_id: 'a', fetched_on: '2026-10-25' },
      { video_id: 'a', fetched_on: '2026-10-22' },
      { video_id: 'b', fetched_on: '2026-10-21' },
    ]
    expect(lastShownDates(rows, [], '2026-11-02')).toEqual(
      new Map([
        ['a', '2026-10-25'],
        ['b', '2026-10-21'],
      ]),
    )
  })

  it('treats videos on the current screen as shown today', () => {
    const dates = lastShownDates([{ video_id: 'a', fetched_on: '2026-10-20' }], ['a', 'c'], '2026-11-02')
    expect(dates.get('a')).toBe('2026-11-02')
    expect(dates.get('c')).toBe('2026-11-02')
  })
})

describe('rankCandidates', () => {
  it('picks shown channel videos oldest first, whatever their relevance', () => {
    const { channel } = rankCandidates({
      channel: [s('yesterday', 'A', ['habits'], 7), s('lastWeek', 'B', ['alone'], 1), s('midWeek', 'C', ['growth'], 5)],
      keyword: [],
      lastShown: new Map([
        ['yesterday', '2026-11-01'],
        ['lastWeek', '2026-10-26'],
        ['midWeek', '2026-10-29'],
      ]),
      groupOf,
    })
    expect(ids(channel)).toEqual(['lastWeek', 'midWeek', 'yesterday'])
  })

  it('keeps ranking order among videos shown on the same day', () => {
    const { channel } = rankCandidates({
      channel: [s('first', 'A'), s('second', 'B')],
      keyword: [],
      lastShown: shown('first', 'second'),
      groupOf,
    })
    expect(ids(channel)).toEqual(['first', 'second'])
  })

  it('caps a channel by its least recently shown videos', () => {
    const { channel } = rankCandidates({
      channel: [s('new', 'A', ['habits'], 7), s('old', 'A', ['habits'], 1), s('fresh', 'A', ['habits'], 3)],
      keyword: [],
      lastShown: new Map([
        ['new', '2026-11-01'],
        ['old', '2026-10-26'],
      ]),
      groupOf,
    })
    expect(ids(channel)).toEqual(['fresh', 'old'])
  })

  it('moves recently shown channel videos to the back instead of dropping them', () => {
    const { channel } = rankCandidates({
      channel: [s('seen', 'A'), s('fresh', 'B')],
      keyword: [],
      lastShown: shown('seen'),
      groupOf,
    })
    expect(ids(channel)).toEqual(['fresh', 'seen'])
  })

  it('applies the per-channel cap after deferring shown videos', () => {
    const { channel } = rankCandidates({
      channel: [s('a1', 'A'), s('a2', 'A'), s('a3', 'A'), s('a4', 'A')],
      keyword: [],
      lastShown: shown('a1', 'a2'),
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
      lastShown: shown('seenHabit'),
      groupOf,
    })
    expect(ids(channel)).toEqual(['solo1', 'story', 'solo2', 'seenHabit'])
  })

  it('drops recently shown keyword videos and mixes topics', () => {
    const { keyword } = rankCandidates({
      channel: [],
      keyword: [s('k0', 'X', ['living alone'], 6), s('k1', 'Y', ['alone'], 5), s('old', 'Z'), s('k2', 'W', ['habits'], 4)],
      lastShown: shown('old'),
      groupOf,
    })
    expect(ids(keyword)).toEqual(['k0', 'k2', 'k1'])
  })

  it('falls back to all keyword videos when nothing else is left', () => {
    const { keyword } = rankCandidates({ channel: [], keyword: [s('k0', 'X')], lastShown: shown('k0'), groupOf })
    expect(ids(keyword)).toEqual(['k0'])
  })
})
