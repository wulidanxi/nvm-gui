export function formatReleaseNotes(value: unknown): string | undefined {
  const source = typeof value === 'string'
    ? value
    : Array.isArray(value)
      ? value.map(item => noteFrom(item)).filter(Boolean).join('\n')
      : ''

  if (!source.trim()) return undefined

  const text = decodeHtmlEntities(source
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*li(?:\s[^>]*)?>/gi, '• ')
    .replace(/<\s*\/li\s*>/gi, '\n')
    .replace(/<\s*\/?(?:h[1-6]|p|ul|ol|blockquote)(?:\s[^>]*)?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/`([^`]+)`/g, '$1'))

  const lines = text.split(/\r?\n/)
    .map(line => line.trim().replace(/^#{1,6}\s*/, '').replace(/^[-*]\s+/, '• '))
    .filter(Boolean)

  const warningIndex = lines.findIndex(line => /^(?:>\s*)?WARNING:/i.test(line))
  const content = (warningIndex >= 0 ? lines.slice(0, warningIndex) : lines)
    .filter(line => !/^\[?v?\d+\.\d+\.\d+[^\]]*\]?\s*[-–]\s*\d{4}-\d{2}-\d{2}$/i.test(line))
    .filter(line => !/^(Added|Changed|Fixed|Security|Removed|Deprecated)$/i.test(line))
    .join('\n')

  return content || undefined
}

function noteFrom(item: unknown): string {
  if (!item || typeof item !== 'object' || !('note' in item)) return ''
  return typeof item.note === 'string' ? item.note : ''
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  }
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#x')) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16))
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10))
    return named[entity.toLowerCase()] ?? match
  })
}
