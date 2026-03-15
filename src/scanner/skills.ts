import { readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { ScanConfig, SkillResult, ScanWarning } from './types.js'

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
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('_') || entry.name.startsWith('sdd-')) continue

      const skillMdPath = join(dirPath, entry.name, 'SKILL.md')
      try {
        await stat(skillMdPath)
        const content = await readFile(skillMdPath, 'utf-8')

        // Extract description from first paragraph after ## Purpose
        let description: string | undefined
        const purposeMatch = content.match(/##\s*Purpose\s*\n+(.+)/i)
        if (purposeMatch) {
          description = purposeMatch[1].trim().slice(0, 200)
        }

        // Extract triggers from frontmatter or content
        const triggers: string[] = []
        const triggerMatch = content.match(
          /(?:trigger|triggers?):\s*(.+)/gi,
        )
        if (triggerMatch) {
          for (const match of triggerMatch) {
            const value = match.replace(/(?:trigger|triggers?):\s*/i, '').trim()
            if (value) triggers.push(value)
          }
        }

        skills.push({
          name: entry.name,
          path: skillMdPath,
          scope,
          description,
          triggers: triggers.length > 0 ? triggers : undefined,
        })
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
