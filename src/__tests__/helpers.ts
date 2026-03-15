import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const FIXTURES_DIR = join(__dirname, 'fixtures')

export function fixture(name: string): string {
  return join(FIXTURES_DIR, name)
}
