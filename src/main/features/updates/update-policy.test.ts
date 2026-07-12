import { describe, expect, it } from 'vitest'
import { applyUpdateChannelPreference, compareVersions, findNewerRelease } from './update-policy'

describe('application update policy', () => {
  it('applies the selected channel without allowing downgrades', () => {
    const updater = { allowPrerelease: false, allowDowngrade: true }
    applyUpdateChannelPreference(updater, true)
    expect(updater).toEqual({ allowPrerelease: true, allowDowngrade: false })
  })

  it('treats a stable release as newer than its matching preview', () => {
    expect(compareVersions('0.0.17', '0.0.17-a')).toBeGreaterThan(0)
    expect(compareVersions('0.0.16', '0.0.17-a')).toBeLessThan(0)
  })

  it('returns only a newer stable release when previews are disabled', () => {
    const releases = [
      { tag_name: 'v0.0.18-alpha.2', prerelease: true },
      { tag_name: 'v0.0.17', prerelease: false },
      { tag_name: 'v0.0.16', prerelease: false },
    ]
    expect(findNewerRelease(releases, '0.0.17-a', false)?.version).toBe('0.0.17')
    expect(findNewerRelease(releases, '0.0.17-alpha.1', true)?.version).toBe('0.0.18-alpha.2')
  })

  it('does not offer an older stable release to a preview build', () => {
    expect(findNewerRelease([
      { tag_name: 'v0.0.16', prerelease: false },
    ], '0.0.17-a', false)).toBeUndefined()
  })
})
