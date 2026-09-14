import { describe, expect, it } from 'vitest'

import { buildDigitalLink, parseDigitalLink } from './digital-link'
import type { DigitalLinkData } from './types'

const fixedProduct: DigitalLinkData = {
  primaryIdentifier: { ai: '01', value: '08456789000007' },
  qualifiers: [{ ai: '10', value: 'LOT-42' }],
  attributes: [{ ai: '17', value: '270131' }],
}

describe('uncompressed GS1 Digital Link', () => {
  it('builds a deterministic URI for a fixed-measure product', () => {
    expect(buildDigitalLink(fixedProduct, 'https://id.example.org').uri).toBe(
      'https://id.example.org/01/08456789000007/10/LOT-42?17=270131',
    )
  })

  it('orders product qualifiers and attributes canonically', () => {
    const result = buildDigitalLink(
      {
        primaryIdentifier: { ai: '01', value: '08456789000007' },
        qualifiers: [
          { ai: '21', value: 'SERIAL-9' },
          { ai: '10', value: 'LOT-42' },
          { ai: '22', value: 'BLUE' },
        ],
        attributes: [
          { ai: '8005', value: '000899' },
          { ai: '11', value: '260101' },
          { ai: '3922', value: '1299' },
          { ai: '3103', value: '001250' },
          { ai: '17', value: '270131' },
        ],
      },
      'https://example.org/catalog',
    )

    expect(result).toEqual({
      ok: true,
      uri: 'https://example.org/catalog/01/08456789000007/22/BLUE/10/LOT-42/21/SERIAL-9?11=260101&17=270131&3103=001250&3922=1299&8005=000899',
      errors: [],
    })
  })

  it('parses values without losing their observed order and returns a normalized URI', () => {
    const result = parseDigitalLink(
      'https://example.org/01/08456789000007/21/SERIAL-9/10/LOT-42?17=270131&11=260101&3103=001250&3922=1299',
    )

    expect(result.ok).toBe(true)
    expect(result.data?.qualifiers).toEqual([
      { ai: '21', value: 'SERIAL-9' },
      { ai: '10', value: 'LOT-42' },
    ])
    expect(result.data?.attributes).toEqual([
      { ai: '17', value: '270131' },
      { ai: '11', value: '260101' },
      { ai: '3103', value: '001250' },
      { ai: '3922', value: '1299' },
    ])
    expect(result.normalizedUri).toBe(
      'https://example.org/01/08456789000007/10/LOT-42/21/SERIAL-9?11=260101&17=270131&3103=001250&3922=1299',
    )
  })

  it('returns structured errors for non-HTTPS URIs and malformed GS1 data', () => {
    expect(parseDigitalLink('http://example.org/01/08456789000007')).toEqual({
      ok: false,
      errors: [{ code: 'https-required', message: 'A GS1 Digital Link URI must use HTTPS.' }],
    })

    const result = buildDigitalLink(
      {
        primaryIdentifier: { ai: '01', value: '08456789000008' },
        qualifiers: [],
        attributes: [{ ai: '3103', value: '1250' }],
      },
      'https://example.org',
    )
    expect(result.ok).toBe(false)
    expect(result.errors.map((error) => error.code)).toEqual(['invalid-value', 'invalid-value'])
  })

  it('preserves and parses company-internal AI 99 query data', () => {
    const result = parseDigitalLink('https://example.org/01/08456789000007?99=INTERNAL-REF')

    expect(result.ok).toBe(true)
    expect(result.data?.attributes).toEqual([{ ai: '99', value: 'INTERNAL-REF' }])
    expect(result.normalizedUri).toBe('https://example.org/01/08456789000007?99=INTERNAL-REF')
  })
})