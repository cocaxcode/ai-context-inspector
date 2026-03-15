import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { runAllScanners } from '../scanner/index.js'

export function registerScanTool(server: McpServer): void {
  server.tool(
    'scan',
    'Escanea un proyecto y descubre todo su ecosistema AI: MCP servers, archivos de contexto, skills y memorias',
    {
      dir: z.string().optional().describe('Directorio a escanear (default: cwd)'),
      include_user: z.boolean().optional().describe('Incluir configuración del usuario'),
      no_introspect: z.boolean().optional().describe('No conectar a MCP servers'),
      timeout: z.number().optional().describe('Timeout de introspección en ms (default: 10000)'),
    },
    async ({ dir, include_user, no_introspect, timeout }) => {
      try {
        const result = await runAllScanners({
          dir: dir ?? process.cwd(),
          includeUser: include_user ?? false,
          introspect: !(no_introspect ?? false),
          timeout: timeout ?? 10000,
        })

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error escaneando: ${(err as Error).message}`,
            },
          ],
        }
      }
    },
  )
}
