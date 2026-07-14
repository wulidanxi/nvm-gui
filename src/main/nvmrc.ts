/**
 * 读取 .nvmrc 中第一条非空、非注释内容，并规范为无 v 前缀的精确版本。
 * 为避免不同 NVM 实现解释不一致，当前不接受 node、lts/* 等别名。
 */
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
