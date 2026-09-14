import type { AiDefinition } from './types'
import aiInventory from '../data/AI_Catalog-es_ES.csv?raw'

const numeric = /^\d+$/
const alphanumeric = /^[\x21-\x7E]+$/
const date = /^\d{6}$/
const queryAttribute = { location: 'query' } as const

interface AiInventoryRow {
  readonly code: string
  readonly description: string
  readonly title: string
}

interface AiRuleOverride {
  readonly valueType?: AiDefinition['valueType']
  readonly min?: number
  readonly max?: number
  readonly fixed?: boolean
  readonly decimals?: number
  readonly role?: AiDefinition['role']
  readonly pattern?: RegExp
  readonly checkDigit?: boolean
  readonly date?: boolean
  readonly pathOrder?: number
}

const strictRules: Readonly<Record<string, AiRuleOverride>> = {
  '01': { valueType: 'numeric', min: 14, max: 14, fixed: true, pattern: /^\d{14}$/, checkDigit: true, role: 'primary' },
  '10': { valueType: 'alphanumeric', max: 20, pattern: alphanumeric, role: 'qualifier', pathOrder: 2 },
  '21': { valueType: 'alphanumeric', max: 20, pattern: alphanumeric, role: 'qualifier', pathOrder: 3 },
  '22': { valueType: 'alphanumeric', max: 20, pattern: alphanumeric, role: 'qualifier', pathOrder: 1 },
  '11': { valueType: 'date', min: 6, max: 6, fixed: true, pattern: date, date: true },
  '13': { valueType: 'date', min: 6, max: 6, fixed: true, pattern: date, date: true },
  '15': { valueType: 'date', min: 6, max: 6, fixed: true, pattern: date, date: true },
  '16': { valueType: 'date', min: 6, max: 6, fixed: true, pattern: date, date: true },
  '17': { valueType: 'date', min: 6, max: 6, fixed: true, pattern: date, date: true },
  '3103': { valueType: 'decimal', min: 6, max: 6, fixed: true, decimals: 3, pattern: /^\d{6}$/ },
  '3922': { valueType: 'decimal', min: 1, max: 15, decimals: 2, pattern: numeric },
  '8005': { valueType: 'decimal', min: 6, max: 6, fixed: true, decimals: 2, pattern: /^\d{6}$/ },
}

const primaryAis = new Set(['00', '01', '02', '03', '253', '255', '401', '402', '414', '415', '8003', '8004', '8006', '8010', '8017', '8018'])
const qualifierAis = new Set(['10', '21', '22', '235', '254', '8011', '8019'])
const inventory = parseInventory(aiInventory)
const catalog = new Map<string, AiDefinition>(inventory.map((row) => [row.code, createDefinition(row)]))

export function getAiDefinition(code: string): AiDefinition | undefined {
  return catalog.get(code.padStart(2, '0'))
}

export function getAllAiDefinitions(): readonly AiDefinition[] {
  return [...catalog.values()].sort((left, right) => Number(left.code) - Number(right.code))
}

function createDefinition(row: AiInventoryRow): AiDefinition {
  const rules = strictRules[row.code]
  const role = rules?.role ?? (primaryAis.has(row.code) ? 'primary' : qualifierAis.has(row.code) ? 'qualifier' : 'attribute')
  const numericFamily = /^(?:30|37|39\d|3\d{3}|394\d|395\d|43\d{2}|70\d{2}|80\d{2})$/.test(row.code)
  const fixedNumeric = /^(?:3\d{3}|394\d|43(?:21|22|23)|70(?:01|03|06)|80(?:01|05|06|11|17|18|26)|8111)$/.test(row.code)
  const valueType = rules?.valueType ?? (numericFamily ? 'numeric' : 'alphanumeric')
  const min = rules?.min ?? 1
  const max = rules?.max ?? (row.code.startsWith('9') ? 90 : fixedNumeric ? 6 : numericFamily ? 15 : 70)
  const fixed = rules?.fixed ?? fixedNumeric
  const pattern = rules?.pattern ?? (numericFamily ? numeric : alphanumeric)

  return {
    code: row.code,
    name: { es: row.description, en: row.title || row.description },
    dataTitle: row.title || undefined,
    valueType,
    length: { kind: fixed ? 'fixed' : 'variable', min, max },
    implicitDecimals: rules?.decimals,
    role,
    validation: { pattern, requiresCheckDigit: rules?.checkDigit, requiresValidDate: rules?.date },
    serialization: role === 'qualifier' ? { location: 'path', pathOrder: rules?.pathOrder ?? 10 } : queryAttribute,
    category: categoryFor(row.code),
    generationSupport: rules ? 'strict' : 'generic',
    requiresFnc1: !fixed,
  }
}

function parseInventory(source: string): AiInventoryRow[] {
  return source.split(/\r?\n/).slice(1).flatMap((line) => {
    const [rawCode, description, title] = line.split(';')
    const code = rawCode?.trim()
    if (!code || !description) return []
    return [{ code: code.padStart(2, '0'), description: description.trim(), title: title?.trim() ?? '' }]
  })
}

function categoryFor(code: string): string {
  if (/^(?:00|01|02|03|253|255|40\d|41\d|80\d{2})$/.test(code)) return 'identification'
  if (/^(?:10|20|21|22|23\d|24\d|25\d)$/.test(code)) return 'traceability'
  if (/^(?:11|12|13|14|15|16|17|18|19|70\d{2}|72\d{2})$/.test(code)) return 'dates'
  if (/^3/.test(code)) return 'measurements'
  if (/^39/.test(code)) return 'prices'
  if (/^9/.test(code)) return 'internal'
  return 'other'
}
