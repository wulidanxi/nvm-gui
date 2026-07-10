export function parseNvmrc(content: string): string | null {
  const value = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(line => line && !line.startsWith('#'))

  if (!value)
    return null

  const version = value.replace(/^v/i, '')
  if (!/^\d+\.\d+\.\d+$/.test(version))
    throw new Error('Only explicit .nvmrc versions such as 20.11.1 are supported')

  return version
}
