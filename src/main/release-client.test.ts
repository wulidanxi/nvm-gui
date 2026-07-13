import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReleaseClient, summarizeNodeReleases, validateHttpUrl } from './release-client'

vi.mock('node:dns', () => ({
  lookup: vi.fn((_hostname: string, _options: unknown, callback: (error: null, addresses: Array<{ address: string }>) => void) => {
    callback(null, [
      { address: '1.1.1.1' },
      { address: '2606:4700:4700::1111' },
    ])
  }),
}))

describe('ReleaseClient', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('merges Node releases with installed state by major line', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-05-01T00:00:00.000Z'))
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(
      [
        { version: 'v20.10.0', npm: '10.2.3', lts: 'Iron', date: '2023-11-22' },
        { version: 'v20.11.1', npm: '10.2.4', lts: 'Iron', date: '2024-02-13' },
        { version: 'v21.7.3', npm: '10.5.0', lts: false, date: '2024-04-10' },
      ],
    ))))

    const client = new ReleaseClient('nvm-windows')
    await expect(client.listNodeReleaseSummaries('https://nodejs.org/dist/index.json', [
      { version: '20.11.1', active: true, valid: true },
    ])).resolves.toEqual([
      {
        version: 'v21.7.3',
        major: 21,
        npm: '10.5.0',
        lts: false,
        firstReleased: '2024-04-10',
        lastUpdated: '2024-04-10',
        status: 'current',
        installed: false,
      },
      {
        version: 'v20.11.1',
        major: 20,
        npm: '10.2.4',
        lts: 'Iron',
        firstReleased: '2023-11-22',
        lastUpdated: '2024-02-13',
        status: 'lts',
        installed: true,
      },
    ])
  })

  it('summarizes first release, last update, and lifecycle status', () => {
    expect(summarizeNodeReleases([
      { version: 'v26.0.0', lts: false, date: '2026-05-05' },
      { version: 'v26.2.0', lts: false, date: '2026-07-08' },
      { version: 'v24.0.0', lts: false, date: '2025-05-06' },
      { version: 'v24.14.0', lts: 'Krypton', date: '2026-06-23' },
      { version: 'v20.0.0', lts: false, date: '2023-04-17' },
      { version: 'v20.19.5', lts: 'Iron', date: '2026-03-24' },
    ], [], new Date('2026-07-13T00:00:00.000Z'))).toEqual([
      expect.objectContaining({ major: 26, firstReleased: '2026-05-05', lastUpdated: '2026-07-08', status: 'current' }),
      expect.objectContaining({ major: 24, firstReleased: '2025-05-06', lastUpdated: '2026-06-23', status: 'lts' }),
      expect.objectContaining({ major: 20, firstReleased: '2023-04-17', lastUpdated: '2026-03-24', status: 'eol' }),
    ])
  })

  it('rejects non-http release URLs', () => {
    expect(() => validateHttpUrl('file:///tmp/index.json')).toThrow('Only http and https URLs are allowed')
  })
})

