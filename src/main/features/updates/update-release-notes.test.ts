import { describe, expect, it } from 'vitest'
import { formatReleaseNotes } from './update-release-notes'

describe('update release notes', () => {
  it('turns updater HTML into a compact plain-text list', () => {
    const html = '<h2>[0.0.18-alpha.2] - 2026-07-12</h2><h3>Changed</h3><ul><li>展示版本与更新内容</li><li>资源版本为 <code>0.0.18.2</code></li></ul><blockquote><p>WARNING: unsigned installer</p></blockquote>'
    expect(formatReleaseNotes(html)).toBe('• 展示版本与更新内容\n• 资源版本为 0.0.18.2')
  })

  it('supports updater note arrays and decodes entities', () => {
    expect(formatReleaseNotes([{ note: '<p>Fix &amp; improve</p>' }])).toBe('Fix & improve')
  })
})
