import { describe, expect, it } from 'vitest'
import type { CommandRunner } from './command-runner'
import {
  PosixNvmProvider,
  WindowsNvmProvider,
  parseNvmList,
  shellQuote,
} from './nvm-provider'

describe('NVM providers', () => {
  it('parses installed versions from nvm output', () => {
    expect(parseNvmList([
      '  * 20.11.1 (Currently using 64-bit executable)',
      '    18.19.0',
      '->     v22.12.0',
      'system',
    ].join('\n'))).toEqual([
      { version: '20.11.1', active: true, valid: true },
      { version: '18.19.0', active: false, valid: true },
      { version: 'v22.12.0', active: true, valid: true },
    ])
  })

  it('runs Windows nvm commands through the command runner', async () => {
    const runner = fakeRunner({
      run: async (command, args) => `${command} ${args.join(' ')}`,
    })
    const provider = new WindowsNvmProvider(runner)

    await expect(provider.currentManagerVersion()).resolves.toBe('nvm version')
  })

  it('only marks the POSIX arrow row active and excludes aliases', async () => {
    const provider = new PosixNvmProvider(fakeRunner({
      runShell: async () => [
        '       v18.19.0 *',
        '->     v20.11.1 *',
        '       v22.12.0 *',
        '         system *',
        'default -> 20 (-> v20.11.1 *)',
        'node -> stable (-> v22.12.0 *) (default)',
        'lts/* -> lts/jod (-> v22.12.0 *)',
        'lts/iron -> v20.18.1 (-> N/A)',
      ].join('\n'),
    }), () => '/Users/me/.nvm')

    await expect(provider.listInstalledVersions()).resolves.toEqual([
      { version: 'v18.19.0', active: false, valid: true },
      { version: 'v20.11.1', active: true, valid: true },
      { version: 'v22.12.0', active: false, valid: true },
    ])
  })

  it('recognizes the current version in colored POSIX output', () => {
    expect(parseNvmList([
      '\u001B[0;34m       v18.19.0\u001B[0m',
      '\u001B[0;32m->     v20.11.1\u001B[0m',
      '\u001B[0;34mdefault\u001B[0m -> v20.11.1',
    ].join('\n'))).toEqual([
      { version: 'v18.19.0', active: false, valid: true },
      { version: 'v20.11.1', active: true, valid: true },
    ])
  })

  it.each(['->       system *', 'N/A'])('leaves installed versions inactive when current is %s', (current) => {
    expect(parseNvmList([
      '       v18.19.0 *',
      '       v20.11.1 *',
      current,
    ].join('\n'))).toEqual([
      { version: 'v18.19.0', active: false, valid: true },
      { version: 'v20.11.1', active: false, valid: true },
    ])
  })

  it('builds a quoted POSIX nvm shell script', async () => {
    let script = ''
    const runner = fakeRunner({
      runShell: async (value) => {
        script = value
        return '0.40.5'
      },
    })
    const provider = new PosixNvmProvider(runner, () => '/Users/me/.nvm path')

    await provider.currentManagerVersion()

    expect(script).toContain("export NVM_DIR='/Users/me/.nvm path'")
    expect(script).toContain("nvm '--version'")
  })

  it('escapes POSIX shell quotes', () => {
    expect(shellQuote("a'b")).toBe("'a'\\''b'")
  })
})

function fakeRunner(overrides: Partial<CommandRunner>): CommandRunner {
  return {
    run: async () => '',
    runShell: async () => '',
    formatError: error => String((error as Error)?.message || error || ''),
    isCommandMissingError: () => false,
    ...overrides,
  }
}
