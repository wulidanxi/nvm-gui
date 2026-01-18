const fs = require('node:fs')
const path = require('node:path')

function main() {
  const tag = process.env.GITHUB_REF_NAME || ''
  const version = tag.replace(/^v/, '')
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')

  if (!fs.existsSync(changelogPath)) {
    console.error('CHANGELOG.md not found')
    process.exit(1)
  }
  const md = fs.readFileSync(changelogPath, 'utf-8')
  const marker = `## [${version}]`
  const start = md.indexOf(marker)
  if (start === -1) {
    console.error(`Version ${version} not found in CHANGELOG.md`)
    process.exit(1)
  }
  const rest = md.slice(start)
  const nextIdx = rest.indexOf('\n## ')
  const section = nextIdx !== -1 ? rest.slice(0, nextIdx) : rest
  const outPath = path.join(process.cwd(), 'CHANGELOG_RELEASE.md')
  fs.writeFileSync(outPath, `${section.trim()}\n`)
  console.log(`Generated ${outPath} for ${version}`)
}

main()
