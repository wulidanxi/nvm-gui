import type { CommandLogQuery, ExternalLinkTarget } from './types'
import { EXTERNAL_LINKS } from './types'

export function assertNodeVersion(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value))
    throw new Error('Invalid Node version.')
}

export function assertUpdatePreference(value: unknown): asserts value is boolean {
  if (typeof value !== 'boolean') throw new Error('Invalid prerelease update preference.')
}

export function assertExternalLinkTarget(value: unknown): asserts value is ExternalLinkTarget {
  if (typeof value !== 'string' || !(value in EXTERNAL_LINKS)) throw new Error('Invalid external link target.')
}

export function assertCommandLogQuery(value: unknown): asserts value is CommandLogQuery | undefined {
  if (value === undefined) return
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid command log query.')
  const query = value as Record<string, unknown>
  if (query.page !== undefined && (!Number.isInteger(query.page) || Number(query.page) < 1)) throw new Error('Invalid command log page.')
  if (query.pageSize !== undefined && (!Number.isInteger(query.pageSize) || Number(query.pageSize) < 1 || Number(query.pageSize) > 100)) throw new Error('Invalid command log page size.')
  if (query.status !== undefined && query.status !== 'success' && query.status !== 'error') throw new Error('Invalid command log status.')
  if (query.search !== undefined && typeof query.search !== 'string') throw new Error('Invalid command log search.')
}

export function assertRegistryUrl(value: unknown): asserts value is string {
  if (typeof value !== 'string') throw new Error('Invalid registry URL.')
  const url = new URL(value)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Invalid registry URL.')
}
