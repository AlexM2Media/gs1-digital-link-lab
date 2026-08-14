import type { AiDefinition } from './types'

const numeric = /^\d+$/
const alphanumeric = /^[\x21-\x7E]+$/
const date = /^\d{6}$/

const pathQualifier = (pathOrder: number) => ({ location: 'path', pathOrder }) as const

const queryAttribute = { location: 'query' } as const

export const AI_CATALOG = {
  '01': {
    code: '01',
    name: { es: 'Número global de artículo comercial', en: 'Global Trade Item Number' },
    valueType: 'numeric',
    length: { kind: 'fixed', min: 14, max: 14 },
    role: 'primary',
    validation: { pattern: /^\d{14}$/, requiresCheckDigit: true },
    serialization: { location: 'path', pathOrder: 0 },
  },
  '10': {
    code: '10',
    name: { es: 'Lote', en: 'Batch or lot number' },
    valueType: 'alphanumeric',
    length: { kind: 'variable', min: 1, max: 20 },
    role: 'qualifier',
    validation: { pattern: alphanumeric },
    serialization: pathQualifier(2),
  },
  '21': {
    code: '21',
    name: { es: 'Número de serie', en: 'Serial number' },
    valueType: 'alphanumeric',
    length: { kind: 'variable', min: 1, max: 20 },
    role: 'qualifier',
    validation: { pattern: alphanumeric },
    serialization: pathQualifier(3),
  },
  '22': {
    code: '22',
    name: { es: 'Variante de producto', en: 'Consumer product variant' },
    valueType: 'alphanumeric',
    length: { kind: 'variable', min: 1, max: 20 },
    role: 'qualifier',
    validation: { pattern: alphanumeric },
    serialization: pathQualifier(1),
  },
  '11': {
    code: '11',
    name: { es: 'Fecha de producción', en: 'Production date' },
    valueType: 'date',
    length: { kind: 'fixed', min: 6, max: 6 },
    role: 'attribute',
    validation: { pattern: date, requiresValidDate: true },
    serialization: queryAttribute,
  },
  '13': {
    code: '13',
    name: { es: 'Fecha de envasado', en: 'Packaging date' },
    valueType: 'date',
    length: { kind: 'fixed', min: 6, max: 6 },
    role: 'attribute',
    validation: { pattern: date, requiresValidDate: true },
    serialization: queryAttribute,
  },
  '15': {
    code: '15',
    name: { es: 'Consumir preferentemente antes de', en: 'Best before date' },
    valueType: 'date',
    length: { kind: 'fixed', min: 6, max: 6 },
    role: 'attribute',
    validation: { pattern: date, requiresValidDate: true },
    serialization: queryAttribute,
  },
  '16': {
    code: '16',
    name: { es: 'Fecha de retirada o venta', en: 'Sell by date' },
    valueType: 'date',
    length: { kind: 'fixed', min: 6, max: 6 },
    role: 'attribute',
    validation: { pattern: date, requiresValidDate: true },
    serialization: queryAttribute,
  },
  '17': {
    code: '17',
    name: { es: 'Fecha de caducidad', en: 'Expiration date' },
    valueType: 'date',
    length: { kind: 'fixed', min: 6, max: 6 },
    role: 'attribute',
    validation: { pattern: date, requiresValidDate: true },
    serialization: queryAttribute,
  },
  '3103': {
    code: '3103',
    name: { es: 'Peso neto en kilogramos', en: 'Net weight in kilograms' },
    valueType: 'decimal',
    length: { kind: 'fixed', min: 6, max: 6 },
    implicitDecimals: 3,
    role: 'attribute',
    validation: { pattern: /^\d{6}$/ },
    serialization: queryAttribute,
  },
  '3922': {
    code: '3922',
    name: { es: 'Precio', en: 'Price' },
    valueType: 'decimal',
    length: { kind: 'variable', min: 1, max: 15 },
    implicitDecimals: 2,
    role: 'attribute',
    validation: { pattern: numeric },
    serialization: queryAttribute,
  },
  '8005': {
    code: '8005',
    name: { es: 'Precio por kilogramo', en: 'Price per kilogram' },
    valueType: 'decimal',
    length: { kind: 'fixed', min: 6, max: 6 },
    implicitDecimals: 2,
    role: 'attribute',
    validation: { pattern: /^\d{6}$/ },
    serialization: queryAttribute,
  },
} as const satisfies Record<string, AiDefinition>

export type SupportedAi = keyof typeof AI_CATALOG

export function getAiDefinition(code: string): AiDefinition | undefined {
  return AI_CATALOG[code as SupportedAi]
}