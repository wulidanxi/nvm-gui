import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { CommandRunner } from './command-runner'
import {
  PosixNvmProvider,
  WindowsNvmProvider,
  parseNvmList,
  shellQuote,
} from './nvm-provider'

const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : '/bin/bash'

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

  it.each([
    ['config', 'get', 'registry'],
    ['list', '-g', '--depth=0', '--json'],
    ['config', 'set', 'registry', "https://example.com/a'b?x=$(whoami)"],
    ['install', '-g', '@scope/package'],
  ])('loads the POSIX Node environment for npm %j', async (...args) => {
    const run = vi.fn()
    const runShell = vi.fn().mockResolvedValue('npm output')
    const provider = new PosixNvmProvider(fakeRunner({ run, runShell }), () => "/Users/me's home/.nvm")

    await expect(provider.runNpmCommand(args)).resolves.toBe('npm output')

    expect(run).not.toHaveBeenCalled()
    const script = runShell.mock.calls[0][0] as string
    expect(script).toContain(`export NVM_DIR=${shellQuote("/Users/me's home/.nvm")}`)
    expect(script).toContain('if [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh" > /dev/null; fi')
    expect(script.endsWith(` && npm ${args.map(shellQuote).join(' ')}`)).toBe(true)
  })

  it('preserves Windows npm execution and arguments', async () => {
    const run = vi.fn().mockResolvedValue('{}')
    const runShell = vi.fn()
    const provider = new WindowsNvmProvider(fakeRunner({ run, runShell }))
    const args = ['list', '-g', '--depth=0', '--json']

    await expect(provider.runNpmCommand(args)).resolves.toBe('{}')
    expect(run).toHaveBeenCalledWith('npm', args)
    expect(runShell).not.toHaveBeenCalled()
  })

  it('propagates npm failures from the POSIX shell', async () => {
    const error = new Error('npm failed')
    const provider = new PosixNvmProvider(fakeRunner({
      runShell: async () => { throw error },
    }), () => '/Users/me/.nvm')

    await expect(provider.runNpmCommand(['list', '-g'])).rejects.toBe(error)
  })

  it.skipIf(!existsSync(bash))('runs npm with a GUI-like PATH and keeps initialization output out of JSON', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'nvm npm test-'))
    try {
      // 模拟 npm 仅在加载 nvm.sh 后可用，覆盖真实 shell 的环境和输出行为。
      writeFileSync(join(directory, 'nvm.sh'), [
        'echo "initializing nvm"',
        'npm() { printf \'%s\\n\' "$@"; }',
      ].join('\n'))
      const provider = new PosixNvmProvider(fakeRunner({
        runShell: async script => execFileSync(bash, ['--noprofile', '--norc', '-c', script], {
          encoding: 'utf8', env: { ...process.env, PATH: '/usr/bin:/bin' },
        }),
      }), () => directory.replace(/\\/g, '/'))

      await expect(provider.runNpmCommand(['{"dependencies":{}}'])).resolves.toBe('{"dependencies":{}}\n')
      const literal = "https://example.com/a'b?x=$(printf injected)&y=1"
      await expect(provider.runNpmCommand([literal])).resolves.toBe(`${literal}\n`)
    }
    finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it.skipIf(!existsSync(bash))('uses system npm when nvm.sh is absent', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'npm without nvm-'))
    try {
      const provider = new PosixNvmProvider(fakeRunner({
        runShell: async script => execFileSync(bash, ['--noprofile', '--norc', '-c',
          `npm() { printf 'system npm'; }; ${script}`], { encoding: 'utf8' }),
      }), () => directory.replace(/\\/g, '/'))

      await expect(provider.runNpmCommand(['config', 'get', 'registry'])).resolves.toBe('system npm')
    }
    finally {
      rmSync(directory, { recursive: true, force: true })
    }
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
