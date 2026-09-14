export type AiRole = 'primary' | 'qualifier' | 'attribute'

export type AiValueType = 'numeric' | 'alphanumeric' | 'date' | 'decimal'

export type AiGenerationSupport = 'strict' | 'generic'

export interface AiLength {
  readonly kind: 'fixed' | 'variable'
  readonly min: number
  readonly max: number
}

export interface AiValidationRules {
  readonly pattern: RegExp
  readonly requiresValidDate?: boolean
  readonly requiresCheckDigit?: boolean
}

export interface AiSerializationRules {
  readonly location: 'path' | 'query'
  readonly pathOrder?: number
}

export interface AiDefinition {
  readonly code: string
  readonly name: {
    readonly es: string
    readonly en: string
  }
  readonly dataTitle?: string
  readonly valueType: AiValueType
  readonly length: AiLength
  readonly implicitDecimals?: number
  readonly role: AiRole
  readonly validation: AiValidationRules
  readonly serialization: AiSerializationRules
  readonly category?: string
  readonly generationSupport?: AiGenerationSupport
  readonly requiresFnc1?: boolean
}

export interface PrimaryIdentifier {
  readonly ai: string
  readonly value: string
}

export interface Qualifier {
  readonly ai: string
  readonly value: string
}

export interface Attribute {
  readonly ai: string
  readonly value: string
}

export interface DigitalLinkData {
  readonly primaryIdentifier: PrimaryIdentifier
  readonly qualifiers: readonly Qualifier[]
  readonly attributes: readonly Attribute[]
}

export type DigitalLinkErrorCode =
  | 'invalid-uri'
  | 'https-required'
  | 'missing-primary-identifier'
  | 'invalid-path'
  | 'invalid-ai'
  | 'invalid-value'
  | 'duplicate-ai'
  | 'invalid-qualifier'
  | 'compressed-unsupported'

export interface DigitalLinkError {
  readonly code: DigitalLinkErrorCode
  readonly message: string
  readonly ai?: string
}

export interface DigitalLinkGenerationResult {
  readonly ok: boolean
  readonly uri?: string
  readonly errors: readonly DigitalLinkError[]
}

export interface DigitalLinkParseResult {
  readonly ok: boolean
  readonly data?: DigitalLinkData
  readonly normalizedUri?: string
  readonly errors: readonly DigitalLinkError[]
}

export interface GenerationInput {
  readonly domain: string
  readonly gtin: string
  readonly lot?: string
  readonly serial?: string
  readonly variant?: string
  readonly productionDate?: string
  readonly packagingDate?: string
  readonly bestBeforeDate?: string
  readonly sellByDate?: string
  readonly expirationDate?: string
  readonly netWeightKg?: string
  readonly price?: string
  readonly pricePerKg?: string
}

export type InputFormat =
  | 'digital-link'
  | 'digital-link-compressed'
  | 'element-string-bracketed'
  | 'element-string-fnc1'
  | 'gtin'
  | 'invalid'

export interface InputFormatDetection {
  readonly format: InputFormat
  readonly normalizedInput: string
}

export interface ScanResult {
  readonly value: string
  readonly format: string
  readonly source: 'keyboard' | 'paste' | 'image' | 'camera'
}