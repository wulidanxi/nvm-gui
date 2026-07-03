import { describe, expect, it } from 'vitest'
import {
  githubAssetUrl,
  managerAssetName,
  providerForPlatform,
  releaseTagsToOptions,
  validateManagerVersion,
} from './nvm-manager.shared'

describe('nvm manager shared helpers', () => {
  it('selects the provider for each platform', () => {
    expect(providerForPlatform('win32')).toBe('nvm-windows')
    expect(providerForPlatform('darwin')).toBe('nvm-sh')
    expect(providerForPlatform('linux')).toBe('nvm-sh')
  })

  it('validates and normalizes manager versions', () => {
    expect(validateManagerVersion('nvm-windows', 'v1.2.1')).toBe('1.2.1')
    expect(validateManagerVersion('nvm-sh', '0.40.3')).toBe('v0.40.3')
    expect(() => validateManagerVersion('nvm-windows', 'latest')).toThrow()
    expect(() => validateManagerVersion('nvm-sh', 'main')).toThrow()
  })

  it('uses controlled asset names and URLs', () => {
    expect(managerAssetName('nvm-windows')).toBe('nvm-setup.exe')
    expect(githubAssetUrl('nvm-windows', '1.2.1')).toBe(
      'https://github.com/coreybutler/nvm-windows/releases/download/1.2.1/nvm-setup.exe',
    )
    expect(githubAssetUrl('nvm-sh', 'v0.40.3')).toBe(
      'https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh',
    )
  })

  it('maps GitHub release tags to stable install options', () => {
    const options = releaseTagsToOptions('nvm-sh', [
      { tag_name: 'v0.40.3' },
      { tag_name: 'v0.40.3' },
      { tag_name: 'v0.40.2', prerelease: true },
      { tag_name: 'bad' },
    ])

    expect(options).toEqual([
      {
        provider: 'nvm-sh',
        version: 'v0.40.3',
        label: 'v0.40.3',
        source: 'remote',
        recommended: true,
      },
    ])
  })
})
