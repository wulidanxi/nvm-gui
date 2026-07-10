const config = require('../electron-builder.config.js')
const { version } = require('../package.json')
const fs = require('node:fs')

const tag = process.env.GITHUB_REF_NAME
if (tag && tag !== `v${version}`)
  throw new Error(`Release tag ${tag} does not match package version v${version}`)

if (config.buildVersion !== `${version}.0`)
  throw new Error(`electron buildVersion ${config.buildVersion} does not match ${version}.0`)

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8')
if (!changelog.includes(`## [${version}]`))
  throw new Error(`CHANGELOG.md does not contain a ${version} section`)

console.log(`Release version verified: ${version}`)
