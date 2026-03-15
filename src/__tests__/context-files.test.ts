import { describe, it, expect } from 'vitest'
import { scanContextFiles } from '../scanner/context-files.js'
import { fixture } from './helpers.js'

describe('scanContextFiles', () => {
  it('detecta CLAUDE.md y .cursorrules en full-project', async () => {
    const { files } = await scanContextFiles({
      dir: fixture('full-project'),
      includeUser: false,
      introspect: false,
      timeout: 5000,
    })

    const claude = files.find((f) => f.path === 'CLAUDE.md')
    expect(claude).toBeDefined()
    expect(claude!.tool).toBe('claude')
    expect(claude!.type).toBe('file')
    expect(claude!.preview).toContain('Test Project')

    const cursor = files.find((f) => f.path === '.cursorrules')
    expect(cursor).toBeDefined()
    expect(cursor!.tool).toBe('cursor')
  })

  it('retorna vacío para empty-project', async () => {
    const { files } = await scanContextFiles({
      dir: fixture('empty-project'),
      includeUser: false,
      introspect: false,
      timeout: 5000,
    })

    expect(files).toHaveLength(0)
  })

  it('detecta directorio .claude/ con children', async () => {
    const { files } = await scanContextFiles({
      dir: fixture('full-project'),
      includeUser: false,
      introspect: false,
      timeout: 5000,
    })

    const claudeDir = files.find(
      (f) => f.path === '.claude' && f.type === 'directory',
    )
    expect(claudeDir).toBeDefined()
    expect(claudeDir!.children).toBeDefined()
    expect(claudeDir!.children!.length).toBeGreaterThan(0)
  })

  it('detecta .mcp.json como archivo de Claude', async () => {
    const { files } = await scanContextFiles({
      dir: fixture('full-project'),
      includeUser: false,
      introspect: false,
      timeout: 5000,
    })

    const mcp = files.find((f) => f.path === '.mcp.json')
    expect(mcp).toBeDefined()
    expect(mcp!.tool).toBe('claude')
    expect(mcp!.preview).toContain('mcpServers')
  })

  it('cada archivo tiene size > 0', async () => {
    const { files } = await scanContextFiles({
      dir: fixture('full-project'),
      includeUser: false,
      introspect: false,
      timeout: 5000,
    })

    for (const f of files) {
      if (f.type === 'file') {
        expect(f.size).toBeGreaterThan(0)
      }
    }
  })
})
