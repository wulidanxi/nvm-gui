export function isNvmMissingError(error: unknown): boolean {
  const message = String((error as Error)?.message || error || '').toLowerCase()
  return message.includes('nvm manager is not installed')
    || message.includes('not recognized')
    || message.includes('command not found')
}

