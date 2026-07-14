import { posix } from 'node:path'
import type {
  NvmManagerProvider,
  NvmManagerSource,
  NvmManagerVersionOption,
} from '../common/types'

export const WINDOWS_NVM_RECOMMENDED_VERSION = '1.2.1'
export const POSIX_NVM_RECOMMENDED_VERSION = 'v0.40.5'

export const TRUSTED_MANAGER_MANIFEST: Record<string, string> = {
  'nvm-windows/1.2.1': '88a571be0ef1a240f2aa4dfe7bd7e445a0411cee702ab9c17c424658b8ac67e4',
}

/** 返回内置可信清单中的安装包哈希；未知版本不会被提升执行。 */
export function trustedManagerHash(provider: NvmManagerProvider, version: string): string | undefined {
  return TRUSTED_MANAGER_MANIFEST[`${provider}/${normalizeManagerVersion(provider, version)}`]
}

/** 将 Node.js 平台映射为对应的 NVM 实现。 */
export function providerForPlatform(platform: NodeJS.Platform): NvmManagerProvider {
  return platform === 'win32' ? 'nvm-windows' : 'nvm-sh'
}

/** 统一 Windows 无 v 前缀、POSIX 有 v 前缀的版本格式。 */
export function normalizeManagerVersion(
  provider: NvmManagerProvider,
  version: string,
): string {
  const trimmed = version.trim()
  if (provider === 'nvm-windows')
    return trimmed.replace(/^v/i, '')

  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`
}

/** 验证并返回规范化后的管理器精确版本。 */
export function validateManagerVersion(
  provider: NvmManagerProvider,
  version: string,
): string {
  const normalized = normalizeManagerVersion(provider, version)
  const valid = provider === 'nvm-windows'
    ? /^\d+\.\d+\.\d+$/.test(normalized)
    : /^v\d+\.\d+\.\d+$/.test(normalized)

  if (!valid)
    throw new Error(`Invalid ${provider} version: ${version}`)

  return normalized
}

/** 返回上游发布中对应平台的安装资源名。 */
export function managerAssetName(provider: NvmManagerProvider): string {
  return provider === 'nvm-windows' ? 'nvm-setup.exe' : 'install.sh'
}

/** 返回对应 NVM 实现的 GitHub 仓库。 */
export function githubRepoForProvider(provider: NvmManagerProvider): string {
  return provider === 'nvm-windows' ? 'coreybutler/nvm-windows' : 'nvm-sh/nvm'
}

/** 构造经过版本校验的官方安装资源地址。 */
export function githubAssetUrl(provider: NvmManagerProvider, version: string): string {
  const normalized = validateManagerVersion(provider, version)
  if (provider === 'nvm-windows') {
    return `https://github.com/${githubRepoForProvider(provider)}/releases/download/${normalized}/nvm-setup.exe`
  }

  return `https://raw.githubusercontent.com/${githubRepoForProvider(provider)}/${normalized}/install.sh`
}

/** 按 NVM_DIR、XDG_CONFIG_HOME、用户目录的优先级解析 nvm-sh 目录。 */
export function resolvePosixNvmDir(
  env: Record<string, string | undefined>,
  homeDir: string,
): string {
  if (env.NVM_DIR)
    return env.NVM_DIR

  if (env.XDG_CONFIG_HOME)
    return posix.join(env.XDG_CONFIG_HOME, 'nvm')

  return posix.join(homeDir, '.nvm')
}

/** 构造适合当前平台和来源的推荐选项。 */
export function recommendedManagerOption(
  provider: NvmManagerProvider,
  source: NvmManagerSource,
): NvmManagerVersionOption {
  const version = provider === 'nvm-windows'
    ? WINDOWS_NVM_RECOMMENDED_VERSION
    : POSIX_NVM_RECOMMENDED_VERSION

  return {
    provider,
    version,
    label: `${version} (${source === 'embedded' ? 'embedded' : 'recommended'})`,
    source,
    recommended: true,
  }
}

/** 将 GitHub 正式发布标签去重并转换为界面选项。 */
export function releaseTagsToOptions(
  provider: NvmManagerProvider,
  releases: Array<{ tag_name?: string; draft?: boolean; prerelease?: boolean }>,
): NvmManagerVersionOption[] {
  const seen = new Set<string>()
  return releases
    .filter(item => !item.draft && !item.prerelease && item.tag_name)
    .map(item => item.tag_name as string)
    .map((tag) => {
      try {
        return validateManagerVersion(provider, tag)
      }
      catch {
        return null
      }
    })
    .filter((version): version is string => Boolean(version))
    .filter((version) => {
      if (seen.has(version))
        return false
      seen.add(version)
      return true
    })
    .map(version => ({
      provider,
      version,
      label: version,
      source: 'remote' as const,
      recommended: provider === 'nvm-windows'
        ? version === WINDOWS_NVM_RECOMMENDED_VERSION
        : version === POSIX_NVM_RECOMMENDED_VERSION,
    }))
}
