import { compare, valid } from 'semver'

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
 * 按 SemVer 比较版本；loose 兼容旧标签 0.0.8b（等价于 0.0.8-b）。
 * 无效版本返回 NaN，使更新筛选的 > 0 判断失败，避免误报升级。
 */
export function compareVersions(left: string, right: string): number {
  const a = valid(left, { loose: true })
  const b = valid(right, { loose: true })
  return a && b ? compare(a, b) : Number.NaN
}
