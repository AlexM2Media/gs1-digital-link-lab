import { describe, expect, it } from 'vitest'

import { calculateCheckDigit, convertToGtin14, validateGtin } from './gtin'

describe('GTIN utilities', () => {
  it('calculates a GS1 modulo-10 check digit', () => {
    expect(calculateCheckDigit('950110153000')).toBe(3)
  })

  it('validates EAN-13 and normalizes it to GTIN-14', () => {
    expect(validateGtin('4006381333931')).toEqual({
      valid: true,
      normalized: '04006381333931',
      expectedCheckDigit: 1,
    })
  })

  it('validates GTIN-14', () => {
    expect(validateGtin('08456789000007').valid).toBe(true)
  })

  it('reports an incorrect check digit', () => {
    expect(validateGtin('4006381333932')).toEqual({
      valid: false,
      expectedCheckDigit: 1,
      reason: 'invalid-check-digit',
    })
  })

  it('converts supported numeric forms to GTIN-14', () => {
    expect(convertToGtin14('4006381333931')).toBe('04006381333931')
    expect(convertToGtin14('08456789000007')).toBe('08456789000007')
  })
})