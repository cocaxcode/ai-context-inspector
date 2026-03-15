import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { runAllScanners } from '../scanner/index.js'
import { generateHtml } from '../report/generator.js'

export function registerReportTool(server: McpServer): void {
  server.tool(
    'generate_report',
    'Genera un dashboard HTML interactivo con el ecosistema AI del proyecto',
    {
      dir: z.string().optional().describe('Directorio a escanear (default: cwd)'),
      output: z.string().optional().describe('Ruta del archivo HTML (default: ai-context-report.html)'),
      no_introspect: z.boolean().optional().describe('No conectar a MCP servers'),
    },
    async ({ dir, output, no_introspect }) => {
      try {
        const result = await runAllScanners({
          dir: dir ?? process.cwd(),
          includeUser: false,
          introspect: !(no_introspect ?? false),
          timeout: 10000,
        })

        const html = generateHtml(result)
        const outputPath = resolve(output ?? 'ai-context-report.html')

        await mkdir(dirname(outputPath), { recursive: true })
        await writeFile(outputPath, html, 'utf-8')

        return {
          content: [
            {
              type: 'text' as const,
              text: `Reporte generado: ${outputPath}\n\nResumen:\n- MCP Servers: ${result.mcpServers.length}\n- Tools: ${result.mcpServers.reduce((s, m) => s + (m.introspection?.tools.length ?? 0), 0)}\n- Archivos: ${result.contextFiles.length}\n- Skills: ${result.skills.length}\n- Memorias: ${result.memories.length}`,
            },
          ],
        }
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error generando reporte: ${(err as Error).message}`,
            },
          ],
        }
      }
    },
  )
}
