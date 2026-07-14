/** electron-updater 中与更新通道有关的最小可写接口。 */
export interface UpdateChannelTarget {
  allowPrerelease: boolean
  allowDowngrade: boolean
}

/** 从 GitHub Releases API 使用的候选发布字段。 */
export interface ReleaseCandidate {
  tag_name?: string
  body?: string
  draft?: boolean
  prerelease?: boolean
}

/** 应用通道偏好，同时明确禁止自动降级到更低版本。 */
export function applyUpdateChannelPreference(
  updater: UpdateChannelTarget,
  includePrerelease: boolean,
): void {
  updater.allowPrerelease = includePrerelease
  updater.allowDowngrade = false
}

/** 按当前通道查找第一个高于已安装版本的非草稿发布。 */
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

/**
 * 比较稳定版和常见预发布版本。
 * 缺少预发布段的稳定版高于相同核心版本的 alpha/beta 版本。
 */
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
