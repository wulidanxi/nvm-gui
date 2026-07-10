import { describe, expect, it } from 'vitest'
import { AsyncMutex } from './async-mutex'

describe('AsyncMutex', () => {
  it('runs mutations in submission order', async () => {
    const mutex = new AsyncMutex()
    const events: string[] = []

    const first = mutex.runExclusive(async () => {
      events.push('first:start')
      await Promise.resolve()
      events.push('first:end')
    })
    const second = mutex.runExclusive(async () => {
      events.push('second:start')
      events.push('second:end')
    })

    await Promise.all([first, second])
    expect(events).toEqual(['first:start', 'first:end', 'second:start', 'second:end'])
  })
})
