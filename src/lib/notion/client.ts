// Server-only: reads NOTION_TOKEN. Import this file only from server code
// (Server Actions / route handlers), never from a client component.
const API = 'https://api.notion.com/v1'

export type NotionErrorCode = 'missing-config' | 'unauthorized' | 'not-found' | 'failed'

export class NotionError extends Error {
  code: NotionErrorCode
  constructor(code: NotionErrorCode, message?: string) {
    super(message ?? `Notion request failed: ${code}`)
    this.name = 'NotionError'
    this.code = code
  }
}

function config() {
  const token = process.env.NOTION_TOKEN
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID
  if (!token || !dataSourceId) throw new NotionError('missing-config', 'Notion is not configured')
  return { token, dataSourceId }
}

async function request(token: string, path: string, method: 'POST' | 'PATCH', body: unknown) {
  let res: Response
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2025-09-03',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new NotionError('failed', 'Notion request failed (network)')
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new NotionError('unauthorized')
    if (res.status === 404) throw new NotionError('not-found')
    throw new NotionError('failed', `Notion request failed (${res.status})`)
  }
  return res
}

export async function createNotionPage(properties: Record<string, unknown>): Promise<{ id: string; url: string }> {
  const { token, dataSourceId } = config()
  const res = await request(token, '/pages', 'POST', {
    parent: { type: 'data_source_id', data_source_id: dataSourceId },
    properties,
  })
  const json = (await res.json()) as { id: string; url: string }
  return { id: json.id, url: json.url }
}

export async function updateNotionPage(pageId: string, properties: Record<string, unknown>): Promise<void> {
  const { token } = config()
  await request(token, `/pages/${pageId}`, 'PATCH', { properties })
}
