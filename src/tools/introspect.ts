import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { scanMcpConfigs } from '../scanner/mcp-configs.js'
import { introspectServers } from '../scanner/mcp-introspect.js'

export function registerIntrospectTool(server: McpServer): void {
  server.tool(
    'introspect_mcp',
    'Introspecciona un MCP server específico: lista sus tools, resources y prompts',
    {
      server_name: z.string().describe('Nombre del server MCP a introspeccionar'),
      dir: z.string().optional().describe('Directorio del proyecto (default: cwd)'),
      timeout: z.number().optional().describe('Timeout en ms (default: 10000)'),
    },
    async ({ server_name, dir, timeout }) => {
      try {
        const { servers } = await scanMcpConfigs({
          dir: dir ?? process.cwd(),
          includeUser: true,
        })

        const target = servers.find((s) => s.name === server_name)
        if (!target) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Server '${server_name}' no encontrado en la configuración. Servers disponibles: ${servers.map((s) => s.name).join(', ') || '(ninguno)'}`,
              },
            ],
          }
        }

        await introspectServers([target], timeout ?? 10000)

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(target, null, 2),
            },
          ],
        }
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error introspectando: ${(err as Error).message}`,
            },
          ],
        }
      }
    },
  )
}
