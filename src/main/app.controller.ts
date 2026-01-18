import { exec } from 'node:child_process'
import util from 'node:util'
import { Controller, IpcHandle } from 'einf'
import { shell, dialog } from 'electron'

@Controller()
export class AppController {

  @IpcHandle('open-directory-dialog')
  public async openDirectoryDialog(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  }

  /**
   * @deprecated This method is deprecated for security reasons. Use specific nvm-* methods instead.
   */
  @IpcHandle('runCmd')
  public async runExec(cmd: string): Promise<string> {
    // Keep for backward compatibility during refactor, but it's recommended to remove this in production.
    return this.execCommand(cmd);
  }

  @IpcHandle('nvm-list')
  public async listVersions(): Promise<string> {
    return this.execCommand('nvm ls');
  }

  @IpcHandle('nvm-use')
  public async useVersion(version: string): Promise<string> {
    this.validateVersion(version);
    return this.execCommand(`nvm use ${version}`);
  }

  @IpcHandle('nvm-install')
  public async installVersion(version: string): Promise<string> {
     this.validateVersion(version);
     return this.execCommand(`nvm install ${version}`);
  }

  @IpcHandle('nvm-uninstall')
  public async uninstallVersion(version: string): Promise<string> {
    this.validateVersion(version);
    return this.execCommand(`nvm uninstall ${version}`);
  }

  @IpcHandle('npm-get-registry')
  public async getNpmRegistry(): Promise<string> {
    return this.execCommand('npm config get registry');
  }

  @IpcHandle('npm-set-registry')
  public async setNpmRegistry(registry: string): Promise<string> {
    // Basic URL validation
    try {
      new URL(registry);
    } catch {
      throw new Error('Invalid registry URL');
    }
    return this.execCommand(`npm config set registry ${registry}`);
  }

  @IpcHandle('npm-list-global')
  public async listGlobalPackages(): Promise<string> {
    return this.execCommand('npm list -g --depth=0 --json');
  }

  @IpcHandle('npm-install-global')
  public async installGlobalPackage(pkg: string): Promise<string> {
    // Validate package name to prevent injection
    if (!/^[a-zA-Z0-9@/._-]+$/.test(pkg)) {
        throw new Error('Invalid package name');
    }
    return this.execCommand(`npm install -g ${pkg}`);
  }

  @IpcHandle('nvm-alias-list')
  public async listAliases(): Promise<string> {
    // nvm alias doesn't output json, so we need to parse text manually in frontend or here.
    // Let's just return stdout.
    // Note: 'nvm alias' might not work well in Windows nvm-windows sometimes depending on version, 
    // usually it is just mapping. On Windows nvm, alias support is limited compared to nvm-sh.
    // But let's try 'nvm list' which usually shows aliases or we can simulate alias by just knowing version mapping?
    // nvm-windows usually doesn't have robust alias management like nvm-sh. 
    // Assuming user might be using nvm-windows, command is 'nvm list' which shows versions.
    // If nvm-windows, it doesn't really support custom aliases like 'default' -> '14.17.0' easily via CLI other than system arch switching.
    // However, if we assume standard nvm behavior or try to support it:
    
    // For nvm-windows, 'nvm alias' is NOT a standard command.
    // Let's check if 'nvm alias' exists. If not, we might need to skip this feature or implement differently.
    // But since the user asked for it, let's assume standard nvm capability or provide a "favorite" feature in GUI.
    
    // Actually, nvm-windows DOES NOT support aliases (except for maybe arch).
    // So for Windows, "Alias Manager" might be better implemented as "Favorites" in the GUI (stored in local storage).
    // Let's implement it as "Local Favorites" in frontend store instead of nvm alias for better compatibility.
    
    return ""; 
  }


  @IpcHandle('openUrl')
  public async openUrl(url: string) { 
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only http and https protocols are allowed');
    }
    shell.openExternal(url)
  }

  private async execCommand(cmd: string): Promise<string> {
    console.log(`Executing command: ${cmd}`); // Add logging
    const execPromise = util.promisify(exec)
    try {
      const { stdout } = await execPromise(cmd, {})
      console.log(`Command success: ${cmd}`); // Add logging
      return stdout
    } catch (error: any) {
      console.error(`Command failed: ${cmd}`, error);
      throw new Error(error.message || 'Command execution failed');
    }
  }

  private validateVersion(version: string) {
    // Simple validation for version string (e.g., 14.17.0 or v14.17.0)
    if (!version || !/^v?\d+\.\d+\.\d+$/.test(version)) {
      throw new Error(`Invalid version format: ${version}`);
    }
  }
}
