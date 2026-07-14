import { execFile } from 'node:child_process'
import util from 'node:util'

const execFilePromise = util.promisify(execFile)

// 集中执行外部进程，使控制器和 Provider 不直接拼装调用，并统一超时、缓冲区和错误格式。

/** 外部命令的资源限制和窗口行为。 */
export interface CommandRunnerOptions {
  timeout?: number
  maxBuffer?: number
  windowsHide?: boolean
}

/** NVM、npm 等外部命令使用的可替换执行器。 */
export interface CommandRunner {
  run(command: string, args: string[], options?: CommandRunnerOptions): Promise<string>
  runShell(script: string, options?: CommandRunnerOptions): Promise<string>
  formatError(error: unknown): string
  isCommandMissingError(error: unknown): boolean
}

export const DEFAULT_COMMAND_TIMEOUT_MS = 120_000
export const DEFAULT_MAX_BUFFER = 1024 * 1024 * 10

/** 基于 execFile 的默认命令执行器，避免通过 shell 插值用户输入。 */
export class ExecFileCommandRunner implements CommandRunner {
  constructor(private readonly platform: NodeJS.Platform = process.platform) {}

  /** 在 Windows 上经 cmd 定位命令，在 POSIX 上直接执行目标程序。 */
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

  /** 使用登录 shell 执行由应用生成的受控脚本，主要用于加载 nvm-sh。 */
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

  /** 从不同平台的进程错误中提取可展示文本。 */
  public formatError(error: any): string {
    return error?.stderr?.trim()
      || error?.stdout?.trim()
      || error?.message
      || 'Command execution failed'
  }

  /** 判断失败是否来自命令未安装或无法定位。 */
  public isCommandMissingError(error: unknown): boolean {
    const message = this.formatError(error).toLowerCase()
    return message.includes('not recognized')
      || message.includes('command not found')
      || message.includes('not installed')
      || message.includes('not found')
      || message.includes('cannot find')
  }
}
