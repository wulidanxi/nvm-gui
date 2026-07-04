import { posix } from 'node:path'
import type {
  NvmManagerProvider,
  NvmManagerSource,
  NvmManagerVersionOption,
} from '../common/types'

export const WINDOWS_NVM_RECOMMENDED_VERSION = '1.2.1'
export const POSIX_NVM_RECOMMENDED_VERSION = 'v0.40.5'

export function providerForPlatform(platform: NodeJS.Platform): NvmManagerProvider {
  return platform === 'win32' ? 'nvm-windows' : 'nvm-sh'
}

export function normalizeManagerVersion(
  provider: NvmManagerProvider,
  version: string,
): string {
  const trimmed = version.trim()
  if (provider === 'nvm-windows')
    return trimmed.replace(/^v/i, '')

  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`
}

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

export function managerAssetName(provider: NvmManagerProvider): string {
  return provider === 'nvm-windows' ? 'nvm-setup.exe' : 'install.sh'
}

export function githubRepoForProvider(provider: NvmManagerProvider): string {
  return provider === 'nvm-windows' ? 'coreybutler/nvm-windows' : 'nvm-sh/nvm'
}

export function githubAssetUrl(provider: NvmManagerProvider, version: string): string {
  const normalized = validateManagerVersion(provider, version)
  if (provider === 'nvm-windows') {
    return `https://github.com/${githubRepoForProvider(provider)}/releases/download/${normalized}/nvm-setup.exe`
  }

  return `https://raw.githubusercontent.com/${githubRepoForProvider(provider)}/${normalized}/install.sh`
}

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
