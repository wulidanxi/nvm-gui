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

  it.each([false, true])('does not offer legacy 0.0.8b to 0.0.18 (preview channel: %s)', (prerelease) => {
    expect(findNewerRelease([
      { tag_name: 'v0.0.8b', prerelease },
    ], '0.0.18', prerelease)).toBeUndefined()
  })

  it.each([
    ['0.0.8b', '0.0.18'],
    ['v0.0.8b', '0.0.8'],
    ['0.0.19-beta.2', '0.0.19-beta.10'],
    ['0.0.19-beta', '0.0.19-beta.1'],
    ['0.0.19-1', '0.0.19-alpha'],
  ])('orders %s below %s', (older, newer) => {
    expect(compareVersions(older, newer)).toBeLessThan(0)
    expect(compareVersions(newer, older)).toBeGreaterThan(0)
  })

  it('ignores build metadata when comparing versions', () => {
    expect(compareVersions('0.0.18+mac.2', '0.0.18+mac.1')).toBe(0)
  })

  it('skips invalid tags and still finds a valid newer preview', () => {
    expect(findNewerRelease([
      { tag_name: 'not-a-version', prerelease: true },
      { tag_name: 'v0.0.8b', prerelease: true },
      { tag_name: 'v0.0.19-beta.1', prerelease: true },
    ], '0.0.18', true)?.version).toBe('0.0.19-beta.1')
  })

  it('does not offer an update when the current version cannot be parsed', () => {
    expect(findNewerRelease([
      { tag_name: 'v0.0.19', prerelease: false },
    ], 'invalid', false)).toBeUndefined()
  })
})
