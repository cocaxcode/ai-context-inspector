/**
 * Parse YAML frontmatter from markdown files (between --- delimiters)
 */
export function parseFrontmatter(
  content: string,
): Record<string, string> | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return null

  const result: Record<string, string> = {}
  let currentKey = ''
  let currentValue = ''

  for (const line of match[1].split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (kvMatch) {
      if (currentKey) result[currentKey] = currentValue.trim()
      currentKey = kvMatch[1]
      currentValue = kvMatch[2].replace(/^["'>-]\s*/, '').replace(/"$/, '')
    } else if (currentKey && line.match(/^\s+/)) {
      currentValue += ' ' + line.trim()
    }
  }
  if (currentKey) result[currentKey] = currentValue.trim()

  return result
}
