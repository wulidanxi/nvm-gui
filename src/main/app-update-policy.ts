export interface UpdateChannelTarget {
  allowPrerelease: boolean
  allowDowngrade: boolean
}

export interface ReleaseCandidate {
  tag_name?: string
  body?: string
  draft?: boolean
  prerelease?: boolean
}

export function applyUpdateChannelPreference(
  updater: UpdateChannelTarget,
  includePrerelease: boolean,
): void {
  updater.allowPrerelease = includePrerelease
  updater.allowDowngrade = false
}

export function findNewerRelease(
  releases: ReleaseCandidate[],
  currentVersion: string,
  includePrerelease: boolean,
): { version: string, notes?: string } | undefined {
  const release = releases.find(item =>
    !item.draft
    && item.prerelease === includePrerelease
    && Boolean(item.tag_name)
    && compareVersions(item.tag_name!, currentVersion) > 0,
  )
  if (!release?.tag_name)
    return undefined
  return { version: release.tag_name.replace(/^v/, ''), notes: release.body }
}

export function compareVersions(left: string, right: string): number {
  const parse = (value: string) => value.replace(/^v/, '').split(/[.-]/).map(part => /^\d+$/.test(part) ? Number(part) : part)
  const a = parse(left)
  const b = parse(right)
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const first = a[index]
    const second = b[index]
    if (first === second) continue
    if (first === undefined) return second === undefined ? 0 : 1
    if (second === undefined) return -1
    if (typeof first === 'number' && typeof second === 'number') return first > second ? 1 : -1
    return String(first).localeCompare(String(second))
  }
  return 0
}
