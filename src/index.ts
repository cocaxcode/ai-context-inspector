import { parseCliArgs, runCli } from './cli.js'

async function main() {
  const options = parseCliArgs(process.argv.slice(2))

  if (options.mcp) {
    // MCP server mode
    const { StdioServerTransport } = await import(
      '@modelcontextprotocol/sdk/server/stdio.js'
    )
    const { createServer } = await import('./server.js')
    const server = createServer()
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('ai-context-inspector MCP server running on stdio')
  } else {
    // CLI mode
    await runCli(options)
  }
}

main().catch((error) => {
  console.error('Fatal:', error)
  process.exit(1)
})
