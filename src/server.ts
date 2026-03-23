import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerScanTool } from './tools/scan.js'
import { registerIntrospectTool } from './tools/introspect.js'
import { registerReportTool } from './tools/report.js'
import { registerExportTool } from './tools/export.js'
import { registerImportTool } from './tools/import.js'

declare const __PKG_VERSION__: string
const VERSION = typeof __PKG_VERSION__ !== 'undefined' ? __PKG_VERSION__ : '0.0.0'

const INSTRUCTIONS = `ai-context-inspector escanea proyectos para descubrir su ecosistema AI completo: MCP servers, archivos de contexto, skills y memorias.

FLUJO TÍPICO:
1. Usa scan para descubrir todo el ecosistema AI de un proyecto.
2. Usa introspect_mcp para ver los tools/resources de un MCP server específico.
3. Genera un dashboard HTML interactivo con generate_report.
4. Exporta el ecosistema a .aci/bundle.json con export_ecosystem.
5. Importa un bundle en otro proyecto con import_ecosystem (soporta 7 herramientas AI).

COMPORTAMIENTO:
- scan detecta configuraciones de 13 herramientas AI distintas.
- introspect_mcp se conecta como cliente MCP al server indicado.
- export_ecosystem maneja secretos con 3 modos: none (redactar), all (incluir), o selectivo.
- import_ecosystem adapta la configuración al target (claude, cursor, windsurf, copilot, gemini, codex, opencode).
- include_user: true en scan incluye configuración a nivel de usuario (~/.claude, skills, memorias).`

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'ai-context-inspector',
    version: VERSION,
  }, {
    instructions: INSTRUCTIONS,
  })

  registerScanTool(server)
  registerIntrospectTool(server)
  registerReportTool(server)
  registerExportTool(server)
  registerImportTool(server)

  return server
}
