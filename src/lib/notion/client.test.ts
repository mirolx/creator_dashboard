import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNotionPage, NotionError, updateNotionPage } from './client'

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })
const fail = (status: number) => ({ ok: false, status, json: async () => ({}) })

beforeEach(() => {
  vi.stubEnv('NOTION_TOKEN', 'secret_tok')
  vi.stubEnv('NOTION_DATA_SOURCE_ID', 'ds-1')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('notion client', () => {
  it('creates the page under the data source', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ id: 'p1', url: 'https://notion.so/p1' }))
    vi.stubGlobal('fetch', fetchMock)
    const props = { 제목: { title: [] } }
    await expect(createNotionPage(props)).resolves.toEqual({ id: 'p1', url: 'https://notion.so/p1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.notion.com/v1/pages')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer secret_tok')
    expect(init.headers['Notion-Version']).toBe('2025-09-03')
    expect(JSON.parse(init.body)).toEqual({
      parent: { type: 'data_source_id', data_source_id: 'ds-1' },
      properties: props,
    })
  })

  it('throws missing-config when NOTION_TOKEN is empty', async () => {
    vi.stubEnv('NOTION_TOKEN', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(createNotionPage({})).rejects.toMatchObject({ code: 'missing-config' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws missing-config when the data source id is missing', async () => {
    vi.stubEnv('NOTION_DATA_SOURCE_ID', '')
    vi.stubGlobal('fetch', vi.fn())
    await expect(createNotionPage({})).rejects.toBeInstanceOf(NotionError)
  })

  it('maps statuses to error codes', async () => {
    const cases: [number, string][] = [[401, 'unauthorized'], [403, 'unauthorized'], [404, 'not-found'], [500, 'failed']]
    for (const [status, code] of cases) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fail(status)))
      await expect(createNotionPage({})).rejects.toMatchObject({ code })
    }
  })

  it('maps network failure to failed without leaking the token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    const err = await createNotionPage({}).catch((e) => e)
    expect(err.code).toBe('failed')
    expect(err.message).not.toContain('secret_tok')
  })

  it('updates with PATCH /v1/pages/:id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({}))
    vi.stubGlobal('fetch', fetchMock)
    await expect(updateNotionPage('abc', { a: 1 })).resolves.toBeUndefined()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.notion.com/v1/pages/abc')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ properties: { a: 1 } })
  })
})
