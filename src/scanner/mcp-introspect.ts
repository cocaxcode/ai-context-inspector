import type {
  McpServerResult,
  McpIntrospectionResult,
  McpToolInfo,
  McpResourceInfo,
  McpPromptInfo,
} from './types.js'

async function introspectOne(
  server: McpServerResult,
  timeout: number,
): Promise<McpIntrospectionResult> {
  if (server.config.transport !== 'stdio' || !server.config.command) {
    return {
      status: 'error',
      error: `Transport "${server.config.transport}" no soportado para introspección (solo stdio en MVP)`,
      tools: [],
      resources: [],
      prompts: [],
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    // Dynamic import to avoid bundling issues
    const { Client } = await import(
      '@modelcontextprotocol/sdk/client/index.js'
    )
    const { StdioClientTransport } = await import(
      '@modelcontextprotocol/sdk/client/stdio.js'
    )

    const transport = new StdioClientTransport({
      command: server.config.command,
      args: server.config.args,
      env: server.config.env
        ? ({ ...process.env, ...server.config.env } as Record<string, string>)
        : undefined,
    })

    const client = new Client(
      { name: 'ai-context-inspector', version: '1.0.0' },
    )

    // Abort on timeout
    controller.signal.addEventListener('abort', () => {
      transport.close().catch(() => {})
    })

    await client.connect(transport)

    const serverInfo = client.getServerVersion()
    const capabilities = client.getServerCapabilities()
    const instructions = client.getInstructions()

    // List tools with pagination
    const tools: McpToolInfo[] = []
    let toolsCursor: string | undefined
    do {
      const result = await client.listTools(
        toolsCursor ? { cursor: toolsCursor } : undefined,
      )
      for (const t of result.tools) {
        tools.push({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema as Record<string, unknown> | undefined,
        })
      }
      toolsCursor = result.nextCursor
    } while (toolsCursor)

    // List resources with pagination
    const resources: McpResourceInfo[] = []
    try {
      let resCursor: string | undefined
      do {
        const result = await client.listResources(
          resCursor ? { cursor: resCursor } : undefined,
        )
        for (const r of result.resources) {
          resources.push({
            name: r.name,
            uri: r.uri,
            description: r.description,
            mimeType: r.mimeType,
          })
        }
        resCursor = result.nextCursor
      } while (resCursor)
    } catch {
      // Server may not support resources
    }

    // List prompts with pagination
    const prompts: McpPromptInfo[] = []
    try {
      let promptCursor: string | undefined
      do {
        const result = await client.listPrompts(
          promptCursor ? { cursor: promptCursor } : undefined,
        )
        for (const p of result.prompts) {
          prompts.push({
            name: p.name,
            description: p.description,
            arguments: p.arguments?.map((a) => ({
              name: a.name,
              description: a.description,
              required: a.required,
            })),
          })
        }
        promptCursor = result.nextCursor
      } while (promptCursor)
    } catch {
      // Server may not support prompts
    }

    await transport.close()

    return {
      status: 'ok',
      serverInfo: serverInfo
        ? { name: serverInfo.name, version: serverInfo.version }
        : undefined,
      capabilities: capabilities as Record<string, unknown> | undefined,
      instructions,
      tools,
      resources,
      prompts,
    }
  } catch (err: unknown) {
    if (controller.signal.aborted) {
      return {
        status: 'timeout',
        error: `Timeout después de ${timeout}ms`,
        tools: [],
        resources: [],
        prompts: [],
      }
    }
    return {
      status: 'error',
      error: (err as Error).message,
      tools: [],
      resources: [],
      prompts: [],
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function introspectServers(
  servers: McpServerResult[],
  timeout: number,
): Promise<void> {
  const stdioServers = servers.filter(
    (s) => s.config.transport === 'stdio' && s.config.command,
  )

  const results = await Promise.allSettled(
    stdioServers.map((s) => introspectOne(s, timeout)),
  )

  for (let i = 0; i < stdioServers.length; i++) {
    const result = results[i]
    stdioServers[i].introspection =
      result.status === 'fulfilled'
        ? result.value
        : {
            status: 'error',
            error: result.reason?.message ?? 'Error desconocido',
            tools: [],
            resources: [],
            prompts: [],
          }
  }
}
