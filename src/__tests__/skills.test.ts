import { describe, it, expect } from 'vitest'
import { scanSkills } from '../scanner/skills.js'
import { fixture } from './helpers.js'

describe('scanSkills', () => {
  it('detecta SKILL.md en .claude/skills/', async () => {
    const { skills } = await scanSkills({
      dir: fixture('full-project'),
      includeUser: false,
      introspect: false,
      timeout: 5000,
    })

    const testSkill = skills.find((s) => s.name === 'test-skill')
    expect(testSkill).toBeDefined()
    expect(testSkill!.scope).toBe('project')
  })

  it('parsea .atl/skill-registry.md', async () => {
    const { skills } = await scanSkills({
      dir: fixture('full-project'),
      includeUser: false,
      introspect: false,
      timeout: 5000,
    })

    const sddInit = skills.find((s) => s.name === 'sdd-init')
    expect(sddInit).toBeDefined()
  })

  it('retorna vacío sin skills', async () => {
    const { skills } = await scanSkills({
      dir: fixture('empty-project'),
      includeUser: false,
      introspect: false,
      timeout: 5000,
    })

    expect(skills).toHaveLength(0)
  })
})
