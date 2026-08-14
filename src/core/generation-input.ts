import { convertToGtin14, validateGtin } from './gtin'
import type { DigitalLinkData, DigitalLinkError, GenerationInput } from './types'

export interface GenerationDataResult {
  readonly data?: DigitalLinkData
  readonly errors: readonly DigitalLinkError[]
}

export function generationInputToDigitalLinkData(input: GenerationInput): GenerationDataResult {
  const errors: DigitalLinkError[] = []
  if (!validateGtin(input.gtin).valid) errors.push({ code: 'invalid-value', message: 'GTIN has an invalid check digit.', ai: '01' })
  const attributes = [optionalDate('11', input.productionDate, errors), optionalDate('13', input.packagingDate, errors), optionalDate('15', input.bestBeforeDate, errors), optionalDate('16', input.sellByDate, errors), optionalDate('17', input.expirationDate, errors), optionalDecimal('3103', input.netWeightKg, 3, 6, errors), optionalDecimal('3922', input.price, 2, 15, errors), optionalDecimal('8005', input.pricePerKg, 2, 6, errors)].filter((value): value is { ai: string; value: string } => value !== undefined)
  if (errors.length > 0) return { errors }
  return { data: { primaryIdentifier: { ai: '01', value: convertToGtin14(input.gtin) }, qualifiers: [optionalValue('22', input.variant), optionalValue('10', input.lot), optionalValue('21', input.serial)].filter((value): value is { ai: string; value: string } => value !== undefined), attributes }, errors: [] }
}

function optionalValue(ai: string, value: string | undefined): { ai: string; value: string } | undefined { return value ? { ai, value } : undefined }
function optionalDate(ai: string, value: string | undefined, errors: DigitalLinkError[]): { ai: string; value: string } | undefined {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) { errors.push({ code: 'invalid-value', message: `AI ${ai} requires an ISO date.`, ai }); return undefined }
  return { ai, value: `${match[1].slice(-2)}${match[2]}${match[3]}` }
}
function optionalDecimal(ai: string, value: string | undefined, decimals: number, maxDigits: number, errors: DigitalLinkError[]): { ai: string; value: string } | undefined {
  if (!value) return undefined
  const normalized = value.replace(',', '.')
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) { errors.push({ code: 'invalid-value', message: `AI ${ai} requires a numeric value.`, ai }); return undefined }
  const [integerPart, decimalPart = ''] = normalized.split('.')
  if (decimalPart.length > decimals) { errors.push({ code: 'invalid-value', message: `AI ${ai} has too many decimal places.`, ai }); return undefined }
  const digits = `${integerPart}${decimalPart.padEnd(decimals, '0')}`.replace(/^0+(?=\d)/, '') || '0'
  if (digits.length > maxDigits) { errors.push({ code: 'invalid-value', message: `AI ${ai} is too long.`, ai }); return undefined }
  return { ai, value: digits.padStart(maxDigits === 15 ? digits.length : maxDigits, '0') }
}