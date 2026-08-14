import { describe, expect, it } from 'vitest'

import { detectInputFormat } from './input-format'

describe('input format detection', () => {
  it('detects uncompressed GS1 Digital Link URIs', () => {
    expect(detectInputFormat('https://example.org/01/08456789000007/10/ABC123?17=270131').format).toBe(
      'digital-link',
    )
  })

  it('detects bracketed GS1 element strings', () => {
    expect(detectInputFormat('(01)08456789000007(10)ABC123(17)270131').format).toBe(
      'element-string-bracketed',
    )
  })

  it('detects scanner element strings with a group separator', () => {
    expect(detectInputFormat(`010845678900000710ABC123${String.fromCharCode(29)}17270131`).format).toBe(
      'element-string-fnc1',
    )
  })

  it('detects EAN and GTIN numeric input', () => {
    expect(detectInputFormat('4006381333931').format).toBe('gtin')
    expect(detectInputFormat('08456789000007').format).toBe('gtin')
  })

  it('rejects unrelated input', () => {
    expect(detectInputFormat('not a GS1 value').format).toBe('invalid')
  })
})