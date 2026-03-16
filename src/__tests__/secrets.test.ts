import { describe, it, expect } from 'vitest'
import { isSensitiveVar, detectEnvVars, applySecretsPolicy } from '../ecosystem/secrets.js'
import type { McpServerResult } from '../scanner/types.js'

function makeServer(
  name: string,
  env?: Record<string, string>,
  args?: string[],
): McpServerResult {
  return {
    name,
    source: 'project',
    config: {
      transport: 'stdio',
      command: 'node',
      args,
      env,
      hasEnvVars: false,
    },
    introspection: null,
  }
}

describe('isSensitiveVar', () => {
  it('detecta variables sensibles (key, token, secret, password, credential, auth)', () => {
    expect(isSensitiveVar('API_KEY')).toBe(true)
    expect(isSensitiveVar('ACCESS_TOKEN')).toBe(true)
    expect(isSensitiveVar('DB_SECRET')).toBe(true)
    expect(isSensitiveVar('DB_PASSWORD')).toBe(true)
    expect(isSensitiveVar('AWS_CREDENTIAL')).toBe(true)
    expect(isSensitiveVar('GITHUB_AUTH')).toBe(true)
  })

  it('no marca variables comunes como sensibles (NODE_ENV, PORT, DEBUG)', () => {
    expect(isSensitiveVar('NODE_ENV')).toBe(false)
    expect(isSensitiveVar('PORT')).toBe(false)
    expect(isSensitiveVar('DEBUG')).toBe(false)
    expect(isSensitiveVar('LOG_LEVEL')).toBe(false)
    expect(isSensitiveVar('HOST')).toBe(false)
  })
})

describe('detectEnvVars', () => {
  it('extrae env vars de MCP servers', () => {
    const servers = [
      makeServer('s1', { API_KEY: 'abc', NODE_ENV: 'dev' }),
      makeServer('s2', { DB_PASSWORD: 'pass123' }),
    ]

    const vars = detectEnvVars(servers)
    expect(vars).toHaveLength(3)

    const apiKey = vars.find((v) => v.varName === 'API_KEY')
    expect(apiKey).toBeDefined()
    expect(apiKey!.serverName).toBe('s1')
    expect(apiKey!.isSensitive).toBe(true)

    const nodeEnv = vars.find((v) => v.varName === 'NODE_ENV')
    expect(nodeEnv).toBeDefined()
    expect(nodeEnv!.isSensitive).toBe(false)
  })

  it('detecta ${VAR} patterns en args', () => {
    const servers = [
      makeServer('s1', undefined, ['--token', '${MY_TOKEN}', '--host', 'localhost']),
    ]

    const vars = detectEnvVars(servers)
    expect(vars).toHaveLength(1)
    expect(vars[0].varName).toBe('MY_TOKEN')
    expect(vars[0].value).toBe('${MY_TOKEN}')
    expect(vars[0].isSensitive).toBe(true)
  })

  it('maneja servidor sin env vars', () => {
    const servers = [makeServer('s1')]
    const vars = detectEnvVars(servers)
    expect(vars).toHaveLength(0)
  })
})

describe('applySecretsPolicy', () => {
  it('mode none: redacta todas', () => {
    const env = { API_KEY: 'secret', NODE_ENV: 'prod' }
    const result = applySecretsPolicy(env, 'none')

    expect(result.env!.API_KEY).toBe('${API_KEY}')
    expect(result.env!.NODE_ENV).toBe('${NODE_ENV}')
    expect(result.redacted).toEqual(['API_KEY', 'NODE_ENV'])
    expect(result.included).toHaveLength(0)
  })

  it('mode all: incluye todas', () => {
    const env = { API_KEY: 'secret', NODE_ENV: 'prod' }
    const result = applySecretsPolicy(env, 'all')

    expect(result.env!.API_KEY).toBe('secret')
    expect(result.env!.NODE_ENV).toBe('prod')
    expect(result.included).toEqual(['API_KEY', 'NODE_ENV'])
    expect(result.redacted).toHaveLength(0)
  })

  it('custom: respeta decisiones por variable', () => {
    const env = { API_KEY: 'secret', NODE_ENV: 'prod', PORT: '3000' }
    const decisions = { NODE_ENV: true, PORT: true }
    const result = applySecretsPolicy(env, 'custom', decisions)

    expect(result.env!.API_KEY).toBe('${API_KEY}')
    expect(result.env!.NODE_ENV).toBe('prod')
    expect(result.env!.PORT).toBe('3000')
    expect(result.redacted).toEqual(['API_KEY'])
    expect(result.included).toContain('NODE_ENV')
    expect(result.included).toContain('PORT')
  })

  it('preserva ${VAR} ya existentes', () => {
    const env = { API_KEY: '${API_KEY}', NODE_ENV: 'prod' }
    const result = applySecretsPolicy(env, 'none')

    // ${VAR} references are preserved as-is and counted as included
    expect(result.env!.API_KEY).toBe('${API_KEY}')
    expect(result.included).toContain('API_KEY')
    // NODE_ENV gets redacted
    expect(result.env!.NODE_ENV).toBe('${NODE_ENV}')
    expect(result.redacted).toContain('NODE_ENV')
  })
})
