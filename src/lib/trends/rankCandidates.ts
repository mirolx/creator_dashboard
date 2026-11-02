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

/** 추천 기록에서 영상별 마지막 추천일을 구한다. 지금 화면의 영상(onScreen)은 오늘 추천한 것으로 친다. */
export function lastShownDates(
  rows: { video_id: string; fetched_on: string }[],
  onScreen: string[],
  today: string,
): Map<string, string> {
  const dates = new Map<string, string>()
  for (const { video_id, fetched_on } of rows) {
    const known = dates.get(video_id)
    if (!known || fetched_on > known) dates.set(video_id, fetched_on)
  }
  for (const id of onScreen) dates.set(id, today)
  return dates
}

/**
 * 관련도순으로 정렬된 후보를 추천 순서로 다시 줄 세운다. lastShown은 영상별 마지막 추천일("YYYY-MM-DD")이다.
 * - 채널 후보: 후보가 적어서 최근 추천 영상을 빼지 않고 뒤로 미룬 다음 채널당 2개로 자른다.
 *   안 본 영상은 주제가 섞이게 정렬하고, 본 영상은 추천한 지 오래된 순으로 둬서 같은 영상이 매일 나오지 않게 한다.
 * - 키워드 후보: 최근 추천 영상을 빼고 주제가 섞이게 정렬한다. 채널 후보도 없고 다 빠지면 빼지 않은 목록을 쓴다.
 */
export function rankCandidates<T extends ScoredVideo>({
  channel,
  keyword,
  lastShown,
  groupOf,
}: {
  channel: T[]
  keyword: T[]
  lastShown: ReadonlyMap<string, string>
  groupOf: (keyword: string) => string
}): { channel: T[]; keyword: T[] } {
  const isSeen = (v: T) => lastShown.has(v.videoId)
  const order = (list: T[]) => diverseOrder(list, groupOf, MIN_PROMOTE_RELEVANCE)

  const seen = channel
    .filter(isSeen)
    .sort((a, b) => lastShown.get(a.videoId)!.localeCompare(lastShown.get(b.videoId)!))
  const capped = capPerChannel([...channel.filter((v) => !isSeen(v)), ...seen])
  const freshKeyword = keyword.filter((v) => !isSeen(v))
  return {
    channel: [...order(capped.filter((v) => !isSeen(v))), ...capped.filter(isSeen)],
    keyword: order(freshKeyword.length > 0 || capped.length > 0 ? freshKeyword : keyword),
  }
}
