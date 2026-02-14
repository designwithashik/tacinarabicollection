import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const indexPath = resolve('src/index.ts')
const source = readFileSync(indexPath, 'utf8')

const requiredSnippets = [
  'origin: (origin) => {',
  'if (!origin) return origin',
  "if (origin.endsWith('.tacinarabicollection.pages.dev')) return origin",
  "return ''",
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
