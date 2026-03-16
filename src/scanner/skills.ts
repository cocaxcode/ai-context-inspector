import { readFile, readdir, stat, lstat } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { ScanConfig, SkillResult, ScanWarning } from './types.js'
import { parseFrontmatter } from './utils.js'

const SKILL_DIRS_PROJECT = ['.claude/skills']
const SKILL_DIRS_USER = ['~/.claude/skills']

async function scanSkillDir(
  dirPath: string,
  scope: 'project' | 'user',
): Promise<SkillResult[]> {
  const skills: SkillResult[] = []

  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      // Skip shared directory
      if (entry.name.startsWith('_')) continue

      // Check if it's a directory or symlink to directory
      const entryPath = join(dirPath, entry.name)
      let isDir = entry.isDirectory()

      if (entry.isSymbolicLink()) {
        try {
          const targetStat = await stat(entryPath)
          isDir = targetStat.isDirectory()
        } catch {
          continue // Broken symlink
        }
      }

      if (!isDir) continue

      const skillMdPath = join(entryPath, 'SKILL.md')
      try {
        await stat(skillMdPath)
        const content = await readFile(skillMdPath, 'utf-8')

        let description: string | undefined
        let name = entry.name
        const triggers: string[] = []

        // Try YAML frontmatter first
        const frontmatter = parseFrontmatter(content)
        if (frontmatter) {
          if (frontmatter.name) name = frontmatter.name
          if (frontmatter.description) {
            description = frontmatter.description.slice(0, 200)
          }
        }

        // Fallback: extract from ## Purpose section
        if (!description) {
          const purposeMatch = content.match(/##\s*Purpose\s*\n+(.+)/i)
          if (purposeMatch) {
            description = purposeMatch[1].trim().slice(0, 200)
          }
        }

        // Extract triggers
        const triggerMatch = content.match(
          /(?:trigger|triggers?):\s*(.+)/gi,
        )
        if (triggerMatch) {
          for (const match of triggerMatch) {
            const value = match.replace(/(?:trigger|triggers?):\s*/i, '').trim()
            if (value) triggers.push(value)
          }
        }

        // Detect if symlinked (installed from external source)
        let isSymlink = false
        try {
          const lstats = await lstat(entryPath)
          isSymlink = lstats.isSymbolicLink()
        } catch {
          // ignore
        }

        skills.push({
          name,
          path: skillMdPath,
          scope,
          description,
          triggers: triggers.length > 0 ? triggers : undefined,
          isSymlink,
        } as SkillResult & { isSymlink?: boolean })
      } catch {
        // No SKILL.md, skip
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return skills
}

async function parseSkillRegistry(
  registryPath: string,
): Promise<SkillResult[]> {
  const skills: SkillResult[] = []

  try {
    const content = await readFile(registryPath, 'utf-8')

    // Parse markdown table rows: | Skill | Trigger | Path |
    const lines = content.split('\n')
    let inTable = false

    for (const line of lines) {
      if (line.includes('| Skill') && line.includes('Trigger')) {
        inTable = true
        continue
      }
      if (inTable && line.startsWith('|---')) continue
      if (inTable && line.startsWith('|')) {
        const cells = line
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean)
        if (cells.length >= 2) {
          skills.push({
            name: cells[0],
            path: cells[2] ?? registryPath,
            scope: 'project',
            triggers: cells[1] ? [cells[1]] : undefined,
          })
        }
      } else if (inTable) {
        inTable = false
      }
    }
  } catch {
    // Registry doesn't exist
  }

  return skills
}

export async function scanSkills(
  config: ScanConfig,
): Promise<{ skills: SkillResult[]; warnings: ScanWarning[] }> {
  const allSkills: SkillResult[] = []
  const warnings: ScanWarning[] = []

  // Project-level skill directories
  for (const dir of SKILL_DIRS_PROJECT) {
    const fullPath = join(config.dir, dir)
    const found = await scanSkillDir(fullPath, 'project')
    allSkills.push(...found)
  }

  // User-level skill directories
  if (config.includeUser) {
    for (const dir of SKILL_DIRS_USER) {
      const fullPath = dir.startsWith('~/')
        ? join(homedir(), dir.slice(2))
        : dir
      const found = await scanSkillDir(fullPath, 'user')
      allSkills.push(...found)
    }
  }

  // Skill registry
  const registryPath = join(config.dir, '.atl', 'skill-registry.md')
  const registrySkills = await parseSkillRegistry(registryPath)

  // Merge: filesystem skills take priority
  const seen = new Set(allSkills.map((s) => s.name))
  for (const rs of registrySkills) {
    if (!seen.has(rs.name)) {
      allSkills.push(rs)
      seen.add(rs.name)
    }
  }

  return { skills: allSkills, warnings }
}
