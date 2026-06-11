#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
const fs = require('fs')
const path = require('path')

function walk(dir, cb) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      if (['.git', 'node_modules', '.next'].includes(item)) continue
      walk(full, cb)
    } else {
      cb(full)
    }
  }
}

const patterns = [
  /API_KEY\s*=\s*[A-Za-z0-9_\-]{20,}/i,
  /SECRET\s*=\s*.+/i,
  /PRIVATE_KEY\s*=\s*-----BEGIN /i,
]

let found = false
walk(process.cwd(), file => {
  if (!file.endsWith('.js') && !file.endsWith('.ts') && !file.endsWith('.env') && !file.endsWith('.md') && !file.endsWith('.json')) return
  try {
    const content = fs.readFileSync(file, 'utf8')
    for (const re of patterns) {
      if (re.test(content)) {
        console.error('Possible secret found in', file)
        found = true
      }
    }
  } catch (e) {}
})

if (found) {
  console.error('Pre-commit check failed: possible secrets found. Please remove them before committing.')
  process.exit(1)
}

console.log('Pre-commit check passed.')
process.exit(0)
