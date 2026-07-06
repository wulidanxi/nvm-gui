import { describe, expect, it } from 'vitest'
import type { CommandRunner } from './command-runner'
import { NvmInstaller } from './nvm-installer'

describe('NvmInstaller', () => {
  it('rejects invalid manager versions before installation side effects', async () => {
    const installer = new NvmInstaller('nvm-windows', fakeRunner(), () => '')

    await expect(installer.install('latest', 'remote', false))
      .rejects.toThrow('Invalid nvm-windows version: latest')
  })
})

function fakeRunner(): CommandRunner {
  return {
    run: async () => '',
    runShell: async () => '',
    formatError: error => String((error as Error)?.message || error || ''),
    isCommandMissingError: () => false,
  }
}

