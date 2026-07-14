import type { CommandLogCategory } from '../common/types'
import type { CommandRunner, CommandRunnerOptions } from './command-runner'
import type { CommandLogService } from './command-log.service'

/** 为任意 CommandRunner 增加成功、失败和耗时审计，不改变实际执行策略。 */
export class LoggedCommandRunner implements CommandRunner {
  constructor(
    private readonly delegate: CommandRunner,
    private readonly commandLog: CommandLogService,
  ) {}

  public async run(command: string, args: string[], options?: CommandRunnerOptions): Promise<string> {
    return this.record(command, args, () => this.delegate.run(command, args, options))
  }

  public async runShell(script: string, options?: CommandRunnerOptions): Promise<string> {
    // 脚本可能包含用户目录等环境细节，因此日志仅记录类型，不持久化脚本正文。
    return this.record('shell', [], () => this.delegate.runShell(script, options))
  }

  public formatError(error: unknown): string {
    return this.delegate.formatError(error)
  }

  public isCommandMissingError(error: unknown): boolean {
    return this.delegate.isCommandMissingError(error)
  }

  /** 统一包裹命令执行，确保成功和失败都会留下日志，同时保留原始异常。 */
  private async record(command: string, args: string[], action: () => Promise<string>): Promise<string> {
    const startedAt = Date.now()
    try {
      const output = await action()
      await this.commandLog.record({
        category: classify(command), operation: [command, args[0]].filter(Boolean).join(' '),
        command, args, status: 'success', durationMs: Date.now() - startedAt, output,
      })
      return output
    }
    catch (error) {
      await this.commandLog.record({
        category: classify(command), operation: [command, args[0]].filter(Boolean).join(' '),
        command, args, status: 'error', durationMs: Date.now() - startedAt,
        output: this.delegate.formatError(error),
      })
      throw error
    }
  }
}

/** 根据可执行程序名映射日志分类。 */
function classify(command: string): CommandLogCategory {
  if (command === 'npm') return 'npm'
  if (command === 'nvm') return 'nvm'
  if (command === 'shell') return 'nvm-manager'
  return 'system'
}
