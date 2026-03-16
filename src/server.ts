import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerScanTool } from './tools/scan.js'
import { registerIntrospectTool } from './tools/introspect.js'
import { registerReportTool } from './tools/report.js'
import { registerExportTool } from './tools/export.js'
import { registerImportTool } from './tools/import.js'

declare const __PKG_VERSION__: string
const VERSION = typeof __PKG_VERSION__ !== 'undefined' ? __PKG_VERSION__ : '0.0.0'

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'ai-context-inspector',
    version: VERSION,
  })

  registerScanTool(server)
  registerIntrospectTool(server)
  registerReportTool(server)
  registerExportTool(server)
  registerImportTool(server)

  return server
}
