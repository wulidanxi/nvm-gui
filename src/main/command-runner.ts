import { execFile } from 'node:child_process'
import util from 'node:util'

const execFilePromise = util.promisify(execFile)

// Centralizes process execution so controllers and providers never build shell
// calls directly. This keeps timeout, buffering, Windows invocation, and error
// formatting consistent across all NVM/NPM operations.

export interface CommandRunnerOptions {
  timeout?: number
  maxBuffer?: number
  windowsHide?: boolean
}

export interface CommandRunner {
  run(command: string, args: string[], options?: CommandRunnerOptions): Promise<string>
  runShell(script: string, options?: CommandRunnerOptions): Promise<string>
  formatError(error: unknown): string
  isCommandMissingError(error: unknown): boolean
}

export const DEFAULT_COMMAND_TIMEOUT_MS = 120_000
export const DEFAULT_MAX_BUFFER = 1024 * 1024 * 10

export class ExecFileCommandRunner implements CommandRunner {
  constructor(private readonly platform: NodeJS.Platform = process.platform) {}

  public async run(
    command: string,
    args: string[],
    options: CommandRunnerOptions = {},
  ): Promise<string> {
    const executable = this.platform === 'win32'
      ? process.env.ComSpec || 'cmd.exe'
      : command
    const commandArgs = this.platform === 'win32'
      ? ['/d', '/s', '/c', command, ...args]
      : args

    const { stdout } = await execFilePromise(executable, commandArgs, {
      windowsHide: options.windowsHide ?? true,
      timeout: options.timeout ?? DEFAULT_COMMAND_TIMEOUT_MS,
      maxBuffer: options.maxBuffer ?? DEFAULT_MAX_BUFFER,
    })

    return stdout
  }

  public async runShell(
    script: string,
    options: CommandRunnerOptions = {},
  ): Promise<string> {
    const shell = process.env.SHELL || '/bin/bash'
    const { stdout } = await execFilePromise(shell, ['-lc', script], {
      timeout: options.timeout ?? DEFAULT_COMMAND_TIMEOUT_MS,
      maxBuffer: options.maxBuffer ?? DEFAULT_MAX_BUFFER,
    })

    return stdout
  }

  public formatError(error: any): string {
    return error?.stderr?.trim()
      || error?.stdout?.trim()
      || error?.message
      || 'Command execution failed'
  }

  public isCommandMissingError(error: unknown): boolean {
    const message = this.formatError(error).toLowerCase()
    return message.includes('not recognized')
      || message.includes('command not found')
      || message.includes('not installed')
      || message.includes('not found')
      || message.includes('cannot find')
  }
}
