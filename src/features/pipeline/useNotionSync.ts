'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { syncNotionPage } from './notionActions'

const DEBOUNCE_MS = 1000

/** 카드 편집을 Notion에 카드별 1초 디바운스로 반영한다. 실패한 카드 id는 failed에 담긴다. */
export function useNotionSync() {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const [failed, setFailed] = useState<Set<string>>(() => new Set())

  const run = useCallback(async (cardId: string) => {
    let ok = false
    try {
      ok = 'ok' in (await syncNotionPage(cardId))
    } catch {
      ok = false
    }
    setFailed((prev) => {
      if (prev.has(cardId) === !ok) return prev
      const next = new Set(prev)
      if (ok) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }, [])

  const schedule = useCallback(
    (cardId: string) => {
      const existing = timers.current.get(cardId)
      if (existing) clearTimeout(existing)
      timers.current.set(
        cardId,
        setTimeout(() => {
          timers.current.delete(cardId)
          void run(cardId)
        }, DEBOUNCE_MS),
      )
    },
    [run],
  )

  const retry = useCallback(
    (cardId: string) => {
      const existing = timers.current.get(cardId)
      if (existing) clearTimeout(existing)
      timers.current.delete(cardId)
      void run(cardId)
    },
    [run],
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      // 언마운트 시 대기 중인 반영은 버리지 않고 바로 보낸다 (서버 액션은 언마운트 후에도 호출 가능)
      map.forEach((timer, id) => {
        clearTimeout(timer)
        void syncNotionPage(id).catch(() => {})
      })
      map.clear()
    }
  }, [])

  return { schedule, failed, retry }
}
