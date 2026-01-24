import fs from 'node:fs'

const [inputPath] = process.argv.slice(2)

if (!inputPath) {
  console.error('Usage: node extract-theme-tokens.mjs <tokens.css>')
  process.exit(1)
}

const source = fs.readFileSync(inputPath, 'utf8')
const themeBlockMatch = source.match(/@theme\s*\{([\s\S]*?)\}/)

if (!themeBlockMatch) {
  console.error('No @theme block found.')
  process.exit(1)
}

const body = themeBlockMatch[1]
const tokenRegex = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi
const tokens = {}

for (const match of body.matchAll(tokenRegex)) {
  const name = match[1].trim()
  const value = match[2].trim()
  tokens[name] = value
}

process.stdout.write(JSON.stringify(tokens, null, 2))
