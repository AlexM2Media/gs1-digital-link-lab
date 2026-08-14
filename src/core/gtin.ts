export interface GtinValidationResult {
  readonly valid: boolean
  readonly normalized?: string
  readonly expectedCheckDigit?: number
  readonly reason?: 'non-numeric' | 'invalid-length' | 'invalid-check-digit'
}

const GTIN_LENGTHS = new Set([8, 12, 13, 14])

export function calculateCheckDigit(body: string): number {
  if (!/^\d+$/.test(body)) {
    throw new TypeError('The GTIN body must contain only digits.')
  }

  let sum = 0
  for (let index = body.length - 1, position = 0; index >= 0; index -= 1, position += 1) {
    const digit = Number(body[index])
    sum += digit * (position % 2 === 0 ? 3 : 1)
  }

  return (10 - (sum % 10)) % 10
}

export function validateGtin(value: string): GtinValidationResult {
  if (!/^\d+$/.test(value)) {
    return { valid: false, reason: 'non-numeric' }
  }

  if (!GTIN_LENGTHS.has(value.length)) {
    return { valid: false, reason: 'invalid-length' }
  }

  const expectedCheckDigit = calculateCheckDigit(value.slice(0, -1))
  if (Number(value.at(-1)) !== expectedCheckDigit) {
    return { valid: false, expectedCheckDigit, reason: 'invalid-check-digit' }
  }

  return { valid: true, normalized: convertToGtin14(value), expectedCheckDigit }
}

export function convertToGtin14(value: string): string {
  if (!/^\d+$/.test(value)) {
    throw new TypeError('The GTIN must contain only digits.')
  }

  if (!GTIN_LENGTHS.has(value.length)) {
    throw new RangeError('A GTIN must contain 8, 12, 13, or 14 digits.')
  }

  return value.padStart(14, '0')
}