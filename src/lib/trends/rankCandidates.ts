import { diverseOrder, MIN_PROMOTE_RELEVANCE } from './pickTrends'
import type { ScoredVideo } from './scoreVideo'

/** 한 채널이 추천 자리를 독차지하지 않도록 채널당 이 개수까지만 고른다. */
export const MAX_PER_CHANNEL = 2

/** 앞에서부터 채널당 max개까지만 남긴다. */
export function capPerChannel<T extends { channelId: string }>(list: T[], max = MAX_PER_CHANNEL): T[] {
  const perChannel = new Map<string, number>()
  return list.filter((v) => {
    const count = perChannel.get(v.channelId) ?? 0
    if (count >= max) return false
    perChannel.set(v.channelId, count + 1)
    return true
  })
}

/**
 * 관련도순으로 정렬된 후보를 추천 순서로 다시 줄 세운다.
 * - 채널 후보: 후보가 적어서 최근 추천 영상(recent)을 빼지 않고 뒤로 미룬 다음 채널당 2개로 자르고,
 *   안 본 영상과 본 영상을 각각 주제가 섞이게 정렬해 이어 붙인다.
 * - 키워드 후보: 최근 추천 영상을 빼고 주제가 섞이게 정렬한다. 채널 후보도 없고 다 빠지면 빼지 않은 목록을 쓴다.
 */
export function rankCandidates<T extends ScoredVideo>({
  channel,
  keyword,
  recent,
  groupOf,
}: {
  channel: T[]
  keyword: T[]
  recent: Iterable<string>
  groupOf: (keyword: string) => string
}): { channel: T[]; keyword: T[] } {
  const seen = new Set(recent)
  const isSeen = (v: T) => seen.has(v.videoId)
  const order = (list: T[]) => diverseOrder(list, groupOf, MIN_PROMOTE_RELEVANCE)

  const capped = capPerChannel([...channel.filter((v) => !isSeen(v)), ...channel.filter(isSeen)])
  const freshKeyword = keyword.filter((v) => !isSeen(v))
  return {
    channel: [...order(capped.filter((v) => !isSeen(v))), ...order(capped.filter(isSeen))],
    keyword: order(freshKeyword.length > 0 || capped.length > 0 ? freshKeyword : keyword),
  }
}
