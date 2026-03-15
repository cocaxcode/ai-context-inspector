import { readFile, stat, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { homedir } from 'node:os'
import { AI_FILE_CATALOG } from './catalog.js'
import type {
  ScanConfig,
  ContextFileResult,
  ScanWarning,
} from './types.js'

const PREVIEW_MAX_CHARS = 2000

function resolveHome(p: string): string {
  return p.startsWith('~/') ? join(homedir(), p.slice(2)) : p
}

async function scanDirectory(
  dirPath: string,
  projectDir: string,
  scope: 'project' | 'user',
): Promise<ContextFileResult[]> {
  const children: ContextFileResult[] = []
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      try {
        const s = await stat(fullPath)
        let preview: string | null = null
        if (entry.isFile()) {
          try {
            const content = await readFile(fullPath, 'utf-8')
            preview = content.slice(0, PREVIEW_MAX_CHARS)
          } catch {
            preview = null
          }
        }
        children.push({
          path: relative(projectDir, fullPath),
          absolutePath: fullPath,
          tool: 'claude',
          alsoUsedBy: [],
          type: entry.isDirectory() ? 'directory' : 'file',
          scope,
          size: s.size,
          preview,
        })
      } catch {
        // Skip unreadable entries
      }
    }
  } catch {
    // Directory not readable
  }
  return children
}

export async function scanContextFiles(
  config: ScanConfig,
): Promise<{ files: ContextFileResult[]; warnings: ScanWarning[] }> {
  const files: ContextFileResult[] = []
  const warnings: ScanWarning[] = []

  for (const entry of AI_FILE_CATALOG) {
    // Skip user-level entries unless includeUser is true
    if (entry.scope === 'user' && !config.includeUser) continue

    const resolvedPath =
      entry.scope === 'user'
        ? resolveHome(entry.path)
        : join(config.dir, entry.path)

    try {
      const s = await stat(resolvedPath)
      const isDir = s.isDirectory()

      // For catalog entries marked as 'file', skip if it's actually a directory (and vice versa)
      // Exception: .clinerules can be both file and directory
      if (entry.tool === 'cline' && entry.path === '.clinerules') {
        if (
          (entry.type === 'file' && isDir) ||
          (entry.type === 'directory' && !isDir)
        ) {
          continue
        }
      } else if (entry.type === 'file' && isDir) {
        continue
      } else if (entry.type === 'directory' && !isDir) {
        continue
      }

      let preview: string | null = null
      let children: ContextFileResult[] | undefined

      if (isDir) {
        children = await scanDirectory(resolvedPath, config.dir, entry.scope)
      } else {
        try {
          const content = await readFile(resolvedPath, 'utf-8')
          preview = content.slice(0, PREVIEW_MAX_CHARS)
        } catch {
          preview = null
        }
      }

      const result: ContextFileResult = {
        path:
          entry.scope === 'user'
            ? entry.path
            : relative(config.dir, resolvedPath),
        absolutePath: resolvedPath,
        tool: entry.tool,
        alsoUsedBy: entry.alsoUsedBy ?? [],
        type: isDir ? 'directory' : 'file',
        scope: entry.scope,
        size: s.size,
        preview,
        children,
      }

      files.push(result)
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code
      if (code === 'EACCES') {
        warnings.push({
          scanner: 'context-files',
          message: `Permiso denegado: ${resolvedPath}`,
          path: resolvedPath,
        })
        files.push({
          path:
            entry.scope === 'user'
              ? entry.path
              : relative(config.dir, resolvedPath),
          absolutePath: resolvedPath,
          tool: entry.tool,
          alsoUsedBy: entry.alsoUsedBy ?? [],
          type: entry.type,
          scope: entry.scope,
          size: 0,
          preview: null,
          error: 'EACCES',
        })
      }
      // ENOENT = file doesn't exist, just skip silently
    }
  }

  return { files, warnings }
}
