import type { CommandLogCategory } from '../common/types'
import type { CommandRunner, CommandRunnerOptions } from './command-runner'
import type { CommandLogService } from './command-log.service'

export class LoggedCommandRunner implements CommandRunner {
  constructor(
    private readonly delegate: CommandRunner,
    private readonly commandLog: CommandLogService,
  ) {}

  public async run(command: string, args: string[], options?: CommandRunnerOptions): Promise<string> {
    return this.record(command, args, () => this.delegate.run(command, args, options))
  }

  public async runShell(script: string, options?: CommandRunnerOptions): Promise<string> {
    // Shell scripts can contain profile paths or other environment details. Keep the
    // audit entry useful without persisting the script itself.
    return this.record('shell', [], () => this.delegate.runShell(script, options))
  }

  public formatError(error: unknown): string {
    return this.delegate.formatError(error)
  }

  public isCommandMissingError(error: unknown): boolean {
    return this.delegate.isCommandMissingError(error)
  }

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

function classify(command: string): CommandLogCategory {
  if (command === 'npm') return 'npm'
  if (command === 'nvm') return 'nvm'
  if (command === 'shell') return 'nvm-manager'
  return 'system'
}
