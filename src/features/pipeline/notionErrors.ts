import type { NotionErrorCode } from '@/lib/notion/client'

export type NotionMessageKey = 'missingConfig' | 'unauthorized' | 'notFound' | 'failed'

/** Server Action 오류 코드를 pipeline.notion.* 메시지 키로 바꾼다. 알 수 없는 코드는 failed. */
export function notionErrorKey(code: NotionErrorCode | 'invalid' | string): NotionMessageKey {
  switch (code) {
    case 'missing-config':
      return 'missingConfig'
    case 'unauthorized':
      return 'unauthorized'
    case 'not-found':
      return 'notFound'
    default:
      return 'failed'
  }
}
