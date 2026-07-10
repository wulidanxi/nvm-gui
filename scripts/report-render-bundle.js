const fs = require('node:fs')
const path = require('node:path')

const assetDir = path.join('dist', 'render', 'assets')
if (!fs.existsSync(assetDir))
  throw new Error('Renderer assets are missing; run a build first')

const files = fs.readdirSync(assetDir)
  .map(name => ({ name, bytes: fs.statSync(path.join(assetDir, name)).size }))
  .sort((a, b) => b.bytes - a.bytes)
const total = files.reduce((sum, file) => sum + file.bytes, 0)
const lines = [
  '## Renderer bundle summary',
  '',
  `Total assets: ${(total / 1024).toFixed(1)} KiB`,
  '',
  '| Asset | Size |',
  '| --- | ---: |',
  ...files.slice(0, 10).map(file => `| ${file.name} | ${(file.bytes / 1024).toFixed(1)} KiB |`),
]
console.log(lines.join('\n'))
if (process.env.GITHUB_STEP_SUMMARY)
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`)
