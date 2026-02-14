import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const indexPath = resolve('src/index.ts')
const source = readFileSync(indexPath, 'utf8')

const requiredSnippets = [
  'const isAllowedOrigin = (origin: string) => {',
  "origin === 'https://tacinarabicollection.pages.dev'",
  '/^https:\\/\\/[a-z0-9-]+\\.tacinarabicollection\\.pages\\.dev$/.test(origin)',
  'origin: (origin) => {',
  'credentials: true,',
]

const missing = requiredSnippets.filter((snippet) => !source.includes(snippet))

if (missing.length > 0) {
  console.error('CORS assertions failed for worker/src/index.ts')
  for (const snippet of missing) {
    console.error(`- Missing snippet: ${snippet}`)
  }
  process.exit(1)
}

console.log('CORS assertions passed for worker/src/index.ts')
