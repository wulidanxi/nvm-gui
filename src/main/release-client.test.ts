import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReleaseClient, validateHttpUrl } from './release-client'

vi.mock('node:dns', () => ({
  resolve4: vi.fn((_hostname: string, callback: (error: null, addresses: string[]) => void) => {
    callback(null, ['1.1.1.1'])
  }),
  resolve6: vi.fn((_hostname: string, callback: (error: null, addresses: string[]) => void) => {
    callback(null, ['2606:4700:4700::1111'])
  }),
}))

describe('ReleaseClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('merges Node releases with installed state by major line', async () => {
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
        date: '2024-04-10',
        installed: false,
      },
      {
        version: 'v20.11.1',
        major: 20,
        npm: '10.2.4',
        lts: 'Iron',
        date: '2024-02-13',
        installed: true,
      },
    ])
  })

  it('rejects non-http release URLs', () => {
    expect(() => validateHttpUrl('file:///tmp/index.json')).toThrow('Only http and https URLs are allowed')
  })
})

