import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { detectTargetTools } from '../ecosystem/detect-target.js'

describe('detectTargetTools', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `aci-detect-${randomUUID()}`)
    await mkdir(tmpDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tmpDir, { recursive: true, force: true })
    } catch {
      // Cleanup best-effort
    }
  })

  it('detecta claude cuando existe CLAUDE.md', async () => {
    await writeFile(join(tmpDir, 'CLAUDE.md'), '# Project', 'utf-8')

    const tools = await detectTargetTools(tmpDir)
    expect(tools).toContain('claude')
  })

  it('detecta cursor cuando existe .cursorrules', async () => {
    await writeFile(join(tmpDir, '.cursorrules'), 'rules here', 'utf-8')

    const tools = await detectTargetTools(tmpDir)
    expect(tools).toContain('cursor')
  })

  it('detecta multiples herramientas', async () => {
    await writeFile(join(tmpDir, 'CLAUDE.md'), '# Project', 'utf-8')
    await writeFile(join(tmpDir, '.cursorrules'), 'rules', 'utf-8')

    const tools = await detectTargetTools(tmpDir)
    expect(tools).toContain('claude')
    expect(tools).toContain('cursor')
    expect(tools.length).toBeGreaterThanOrEqual(2)
  })

  it('retorna vacio en directorio sin markers', async () => {
    const tools = await detectTargetTools(tmpDir)
    expect(tools).toHaveLength(0)
  })

  it('ordena por cantidad de markers encontrados', async () => {
    // Claude with 2 markers: CLAUDE.md + .claude/
    await writeFile(join(tmpDir, 'CLAUDE.md'), '# Project', 'utf-8')
    await mkdir(join(tmpDir, '.claude'), { recursive: true })

    // Cursor with 1 marker: .cursorrules
    await writeFile(join(tmpDir, '.cursorrules'), 'rules', 'utf-8')

    const tools = await detectTargetTools(tmpDir)
    expect(tools[0]).toBe('claude')
    expect(tools).toContain('cursor')
  })

  it('detecta copilot por .vscode/mcp.json', async () => {
    await mkdir(join(tmpDir, '.vscode'), { recursive: true })
    await writeFile(join(tmpDir, '.vscode/mcp.json'), '{}', 'utf-8')

    const tools = await detectTargetTools(tmpDir)
    expect(tools).toContain('copilot')
  })
})
