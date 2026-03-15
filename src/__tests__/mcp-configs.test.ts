import { describe, it, expect } from 'vitest'
import { scanMcpConfigs } from '../scanner/mcp-configs.js'
import { fixture } from './helpers.js'

describe('scanMcpConfigs', () => {
  it('parsea .mcp.json con server stdio', async () => {
    const { servers } = await scanMcpConfigs({
      dir: fixture('full-project'),
      includeUser: false,
    })

    const testServer = servers.find((s) => s.name === 'test-server')
    expect(testServer).toBeDefined()
    expect(testServer!.config.transport).toBe('stdio')
    expect(testServer!.config.command).toBe('echo')
    expect(testServer!.config.args).toEqual(['hello'])
    expect(testServer!.source).toBe('project')
  })

  it('detecta server http', async () => {
    const { servers } = await scanMcpConfigs({
      dir: fixture('full-project'),
      includeUser: false,
    })

    const remote = servers.find((s) => s.name === 'remote-api')
    expect(remote).toBeDefined()
    expect(remote!.config.transport).toBe('http')
    expect(remote!.config.url).toBe('https://example.com/mcp')
  })

  it('retorna vacío sin .mcp.json', async () => {
    const { servers } = await scanMcpConfigs({
      dir: fixture('empty-project'),
      includeUser: false,
    })

    expect(servers).toHaveLength(0)
  })

  it('detecta hasEnvVars correctamente', async () => {
    const { servers } = await scanMcpConfigs({
      dir: fixture('full-project'),
      includeUser: false,
    })

    // Our test fixture doesn't have env vars
    for (const s of servers) {
      expect(s.config.hasEnvVars).toBe(false)
    }
  })

  it('parsea mcp-only fixture', async () => {
    const { servers } = await scanMcpConfigs({
      dir: fixture('mcp-only'),
      includeUser: false,
    })

    expect(servers).toHaveLength(1)
    expect(servers[0].name).toBe('only-server')
    expect(servers[0].config.command).toBe('node')
  })
})
