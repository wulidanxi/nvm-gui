import { describe, expect, it } from 'vitest'
import { ExecFileCommandRunner } from './command-runner'

describe('ExecFileCommandRunner', () => {
  it('runs a command and returns stdout', async () => {
    const runner = new ExecFileCommandRunner(process.platform)
    await expect(runner.run(process.execPath, ['-e', 'console.log("ok")']))
      .resolves.toMatch(/^ok\r?\n$/)
  })

  it('normalizes stderr and command-missing errors', () => {
    const runner = new ExecFileCommandRunner('win32')

    expect(runner.formatError({ stderr: ' bad command \n', message: 'ignored' })).toBe('bad command')
    expect(runner.isCommandMissingError({ stderr: 'nvm is not recognized' })).toBe(true)
  })
})
