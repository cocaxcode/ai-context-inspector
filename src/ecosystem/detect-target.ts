// ── Auto-deteccion de herramientas AI configuradas en un proyecto ──

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import type { ImportTarget } from './types.js'
import { TOOL_MARKERS } from './target-map.js'

/**
 * Detecta que herramientas AI estan configuradas en el directorio.
 * Comprueba markers de archivos para cada herramienta.
 * Retorna lista ordenada por cantidad de markers encontrados (mas confianza primero).
 */
export async function detectTargetTools(dir: string): Promise<ImportTarget[]> {
  const results: { target: ImportTarget; count: number }[] = []

  for (const [target, markers] of Object.entries(TOOL_MARKERS) as [ImportTarget, string[]][]) {
    let count = 0

    for (const marker of markers) {
      try {
        await access(join(dir, marker))
        count++
      } catch {
        // Marker not found, skip
      }
    }

    if (count > 0) {
      results.push({ target, count })
    }
  }

  // Sort by count descending (more markers = higher confidence)
  results.sort((a, b) => b.count - a.count)

  return results.map((r) => r.target)
}
