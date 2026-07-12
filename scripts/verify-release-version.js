const config = require('../electron-builder.config.js')
const { version } = require('../package.json')
const fs = require('node:fs')

const tag = process.env.GITHUB_REF_NAME
if (tag && tag !== `v${version}`)
  throw new Error(`Release tag ${tag} does not match package version v${version}`)

const expectedBuildVersion = toWindowsBuildVersion(version)
if (config.buildVersion !== expectedBuildVersion)
  throw new Error(`electron buildVersion ${config.buildVersion} does not match ${expectedBuildVersion}`)

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8')
if (!changelog.includes(`## [${version}]`))
  throw new Error(`CHANGELOG.md does not contain a ${version} section`)

console.log(`Release version verified: ${version}`)

function toWindowsBuildVersion(version) {
  const match = /^(\d+\.\d+\.\d+)(?:-(?:(alpha|beta|rc)\.(\d+)|(\d+|[a-z])))?$/.exec(version)
  if (!match)
    throw new Error(`Unsupported package version for Windows buildVersion: ${version}`)

  if (!match[2] && !match[4])
    return `${match[1]}.0`

  const suffix = match[3] || match[4]
  const prereleaseNumber = /^\d+$/.test(suffix)
    ? Number(suffix)
    : suffix.charCodeAt(0) - 96
  if (prereleaseNumber < 1 || prereleaseNumber > 65535)
    throw new Error(`Unsupported prerelease number for Windows buildVersion: ${version}`)
  return `${match[1]}.${prereleaseNumber}`
}
