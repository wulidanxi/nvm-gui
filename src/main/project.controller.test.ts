import { describe, expect, it } from 'vitest'
import { parseNvmrc } from './nvmrc'

describe('parseNvmrc', () => {
  it('uses the first non-comment explicit version', () => {
    expect(parseNvmrc('# generated\n\nv20.11.1\n')).toBe('20.11.1')
  })

  it('rejects ambiguous aliases', () => {
    expect(() => parseNvmrc('lts/iron')).toThrow('Only explicit')
  })
})
