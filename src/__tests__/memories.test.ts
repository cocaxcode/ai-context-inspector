import { describe, it, expect } from 'vitest'
import { scanMemories } from '../scanner/memories.js'
import { fixture } from './helpers.js'

describe('scanMemories', () => {
  it('detecta openspec/ y .atl/', async () => {
    const { memories } = await scanMemories(
      {
        dir: fixture('full-project'),
        includeUser: false,
        introspect: false,
        timeout: 5000,
      },
      [],
    )

    const openspec = memories.find((m) => m.type === 'openspec')
    expect(openspec).toBeDefined()
    expect(openspec!.status).toBe('active')

    const atl = memories.find((m) => m.type === 'atl')
    expect(atl).toBeDefined()
    expect(atl!.status).toBe('active')
  })

  it('detecta engram como MCP', async () => {
    const mockServers = [
      {
        name: 'engram',
        source: 'project' as const,
        config: {
          transport: 'stdio' as const,
          command: 'engram-server',
          hasEnvVars: false,
        },
        introspection: null,
      },
    ]

    const { memories } = await scanMemories(
      {
        dir: fixture('empty-project'),
        includeUser: false,
        introspect: false,
        timeout: 5000,
      },
      mockServers,
    )

    const engram = memories.find((m) => m.type === 'engram')
    expect(engram).toBeDefined()
    expect(engram!.source).toBe('mcp')
    expect(engram!.status).toBe('configured')
  })

  it('retorna vacío sin memorias', async () => {
    const { memories } = await scanMemories(
      {
        dir: fixture('empty-project'),
        includeUser: false,
        introspect: false,
        timeout: 5000,
      },
      [],
    )

    expect(memories).toHaveLength(0)
  })
})
