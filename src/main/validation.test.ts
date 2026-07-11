import { describe, expect, it } from 'vitest'
import {
  assertCommandLogQuery,
  assertExternalLinkTarget,
  assertNodeVersion,
  assertRegistryUrl,
  assertUpdatePreference,
} from '../common/validation'

describe('shared IPC validation', () => {
  it('accepts valid IPC inputs', () => {
    expect(() => assertNodeVersion('22.14.0')).not.toThrow()
    expect(() => assertUpdatePreference(false)).not.toThrow()
    expect(() => assertExternalLinkTarget('projectReleases')).not.toThrow()
    expect(() => assertRegistryUrl('https://registry.npmjs.org/')).not.toThrow()
    expect(() => assertCommandLogQuery({ page: 1, pageSize: 50, status: 'success' })).not.toThrow()
  })

  it('rejects malformed IPC inputs', () => {
    expect(() => assertNodeVersion('latest && calc')).toThrow()
    expect(() => assertUpdatePreference('false')).toThrow()
    expect(() => assertExternalLinkTarget('arbitrary')).toThrow()
    expect(() => assertRegistryUrl('file:///etc/passwd')).toThrow()
    expect(() => assertCommandLogQuery({ pageSize: 1000 })).toThrow()
  })
})
