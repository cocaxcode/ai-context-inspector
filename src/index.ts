import { runCli } from './cli.js'

async function main() {
  const argv = process.argv.slice(2)

  // Check for --mcp flag before subcommand routing
  // (subcommand detection happens inside runCli)
  const hasMcpFlag = argv.includes('--mcp')

  if (hasMcpFlag) {
    // MCP server mode
    const { StdioServerTransport } = await import(
      '@modelcontextprotocol/sdk/server/stdio.js'
    )
    const { createServer } = await import('./server.js')
    const server = createServer()
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('ai-context-inspector MCP server running on stdio')

    const shutdown = async () => {
      console.error('ai-context-inspector: shutting down...')
      try {
        await server.close()
      } catch {
        // Ignorar errores de cierre
      }
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } else {
    // CLI mode (subcommands handled inside runCli)
    await runCli(argv)
  }
}

main().catch((error) => {
  console.error('Fatal:', error)
  process.exit(1)
})
