/** 识别不同平台上“未安装或无法找到 NVM”的常见错误文本。 */
export function isNvmMissingError(error: unknown): boolean {
  const message = String((error as Error)?.message || error || '').toLowerCase()
  return message.includes('nvm manager is not installed')
    || message.includes('not recognized')
    || message.includes('command not found')
}
