import { describe, expect, it } from 'vitest'

import { getAiDefinition, getAllAiDefinitions } from './ai-catalog'

describe('GS1 AI catalog', () => {
  it('exposes the complete local inventory to the generator', () => {
    const codes = new Set(getAllAiDefinitions().map((definition) => definition.code))

    for (const code of ['00', '01', '4300', '7003', '8043', '99']) {
      expect(codes.has(code)).toBe(true)
    }
    expect(codes.size).toBeGreaterThan(200)
  })

  it('keeps generic entries visibly marked as generic generation support', () => {
    expect(getAiDefinition('7003')?.generationSupport).toBe('generic')
    expect(getAiDefinition('7003')?.requiresFnc1).toBe(false)
  })

  it('uses the full description and preserves the GS1 data title', () => {
    const definition = getAllAiDefinitions().find((item) => item.code === '7003')

    expect(definition?.name.es).toContain('Fecha y hora de caducidad')
    expect(definition?.dataTitle).toBe('EXPIRY TIME')
  })
})