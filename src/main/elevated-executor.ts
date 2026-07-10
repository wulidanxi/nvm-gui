import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import util from 'node:util'
import type { CommandLogService } from './command-log.service'

const execFilePromise = util.promisify(execFile)
const OPERATIONS = ['install', 'use', 'uninstall'] as const
const VERSION = /^v?\d+\.\d+\.\d+$/
const EXPECTED_INSTALLER_PUBLISHER = 'CN=Author Software Inc.'

export class ElevatedExecutor {
  constructor(private readonly commandLog?: CommandLogService) {}

  public async executeNvm(operation: string, version: string): Promise<string> {
    if (process.platform !== 'win32')
      throw new Error('Elevated execution is only supported on Windows')
    if (!OPERATIONS.includes(operation as (typeof OPERATIONS)[number]) || !VERSION.test(version))
      throw new Error('Invalid elevated NVM operation')

    const nvmPath = this.resolveNvmExecutable()
    return this.runLogged('nvm', `nvm ${operation}`, 'nvm', [operation, version], () =>
      this.runElevated(`$proc = Start-Process -FilePath '${escapePs(nvmPath)}' -ArgumentList @('${operation}', '${version}') -PassThru -Wait -WindowStyle Hidden\nexit $proc.ExitCode`),
    )
  }

  public async installNvmManager(installerPath: string, expectedHash: string): Promise<string> {
    if (process.platform !== 'win32')
      throw new Error('Elevated execution is only supported on Windows')
    await this.verifyInstaller(installerPath, expectedHash)
    return this.runLogged('nvm-manager', 'nvm manager install', 'nvm-manager', ['install'], () =>
      this.runElevated(`$proc = Start-Process -FilePath '${escapePs(installerPath)}' -ArgumentList @('/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART') -PassThru -Wait -WindowStyle Hidden\nexit $proc.ExitCode`),
    )
  }

  private resolveNvmExecutable(): string {
    const home = process.env.NVM_HOME
    if (!home)
      throw new Error('NVM_HOME is not set; restart the app after installing NVM')
    const root = resolve(home)
    const executable = resolve(root, 'nvm.exe')
    if (!executable.startsWith(`${root}\\`) || !existsSync(executable))
      throw new Error(`NVM executable is not available in NVM_HOME: ${executable}`)
    return executable
  }

  private async verifyInstaller(filePath: string, expectedHash: string): Promise<void> {
    if (!existsSync(filePath) || !filePath.toLowerCase().endsWith('nvm-setup.exe'))
      throw new Error('Invalid NVM installer path')
    const actualHash = createHash('sha256').update(readFileSync(filePath)).digest('hex')
    if (actualHash !== expectedHash.toLowerCase())
      throw new Error('NVM installer SHA-256 verification failed')

    const { stdout } = await execFilePromise('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      `$sig = Get-AuthenticodeSignature -LiteralPath '${escapePs(filePath)}'; Write-Output ($sig.Status.ToString() + '|' + $sig.SignerCertificate.Subject)`,
    ], { windowsHide: true, timeout: 30_000 })
    const [status, subject] = stdout.trim().split('|', 2)
    if (status !== 'Valid' || !subject?.startsWith(EXPECTED_INSTALLER_PUBLISHER))
      throw new Error('NVM installer Authenticode publisher verification failed')
  }

  private async runElevated(body: string): Promise<string> {
    const encoded = Buffer.from(`$ErrorActionPreference = 'Stop'\n${body}`, 'utf16le').toString('base64')
    const command = `$proc = Start-Process -FilePath powershell.exe -ArgumentList '-NoProfile -NonInteractive -EncodedCommand ${encoded}' -PassThru -Verb RunAs -Wait -WindowStyle Hidden; exit $proc.ExitCode`
    const { stdout } = await execFilePromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      windowsHide: true, timeout: 600_000, maxBuffer: 10 * 1024 * 1024,
    })
    return stdout
  }

  private async runLogged(
    category: 'nvm' | 'nvm-manager',
    operation: string,
    command: string,
    args: string[],
    action: () => Promise<string>,
  ): Promise<string> {
    const startedAt = Date.now()
    try {
      const output = await action()
      await this.commandLog?.record({ category, operation, command, args, status: 'success', durationMs: Date.now() - startedAt, output })
      return output
    }
    catch (error) {
      const output = error instanceof Error ? error.message : String(error)
      await this.commandLog?.record({ category, operation, command, args, status: 'error', durationMs: Date.now() - startedAt, output })
      throw error
    }
  }
}

function escapePs(value: string): string {
  return value.replace(/'/g, "''")
}
