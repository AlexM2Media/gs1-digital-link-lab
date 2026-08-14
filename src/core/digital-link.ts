import { getAiDefinition } from './ai-catalog'
import { validateGtin } from './gtin'
import type {
  AiDefinition,
  Attribute,
  DigitalLinkData,
  DigitalLinkError,
  DigitalLinkGenerationResult,
  DigitalLinkParseResult,
  Qualifier,
} from './types'

const PRIMARY_AI = '01'

export function buildDigitalLink(data: DigitalLinkData, domain: string): DigitalLinkGenerationResult {
  const errors = validateDigitalLinkData(data)
  const baseUrl = parseHttpsDomain(domain)

  if (!baseUrl) {
    errors.push({ code: 'https-required', message: 'The Digital Link domain must use HTTPS.' })
  }

  if (errors.length > 0 || !baseUrl) {
    return { ok: false, errors }
  }

  const pathSegments = baseUrl.pathname.split('/').filter(Boolean)
  pathSegments.push(PRIMARY_AI, data.primaryIdentifier.value)

  for (const qualifier of sortForPath(data.qualifiers)) {
    pathSegments.push(qualifier.ai, qualifier.value)
  }

  const query = new URLSearchParams()
  for (const attribute of sortForQuery(data.attributes)) {
    query.append(attribute.ai, attribute.value)
  }

  baseUrl.pathname = `/${pathSegments.map(encodeURIComponent).join('/')}`
  baseUrl.search = query.toString()
  baseUrl.hash = ''

  return { ok: true, uri: baseUrl.toString(), errors: [] }
}

export function parseDigitalLink(input: string): DigitalLinkParseResult {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return failure({ code: 'invalid-uri', message: 'The input is not a valid URI.' })
  }

  if (url.protocol !== 'https:') {
    return failure({ code: 'https-required', message: 'A GS1 Digital Link URI must use HTTPS.' })
  }

  const pathSegments = url.pathname.split('/').filter(Boolean)
  const primaryIndex = pathSegments.indexOf(PRIMARY_AI)
  if (primaryIndex === -1) {
    return failure({
      code: 'compressed-unsupported',
      message: 'Only uncompressed Digital Link URIs with AI 01 in the path are supported.',
    })
  }

  const stemSegments = pathSegments.slice(0, primaryIndex)
  const aiSegments = pathSegments.slice(primaryIndex)
  if (aiSegments.length < 2 || aiSegments.length % 2 !== 0) {
    return failure({ code: 'invalid-path', message: 'The AI path must contain AI/value pairs.' })
  }

  const errors: DigitalLinkError[] = []
  const qualifiers: Qualifier[] = []
  const attributes: Attribute[] = []
  const seenAis = new Set<string>()
  let primaryValue = ''

  for (let index = 0; index < aiSegments.length; index += 2) {
    const ai = aiSegments[index]
    const value = decodePathValue(aiSegments[index + 1], errors, ai)
    if (value === undefined) {
      continue
    }

    if (seenAis.has(ai)) {
      errors.push({ code: 'duplicate-ai', message: `AI ${ai} occurs more than once.`, ai })
      continue
    }
    seenAis.add(ai)

    if (ai === PRIMARY_AI) {
      primaryValue = value
      continue
    }

    const definition = getAiDefinition(ai)
    if (!definition || definition.role !== 'qualifier') {
      errors.push({ code: 'invalid-qualifier', message: `AI ${ai} is not a supported path qualifier.`, ai })
      continue
    }
    qualifiers.push({ ai, value })
  }

  for (const [ai, value] of url.searchParams) {
    if (seenAis.has(ai)) {
      errors.push({ code: 'duplicate-ai', message: `AI ${ai} occurs more than once.`, ai })
      continue
    }
    seenAis.add(ai)

    const definition = getAiDefinition(ai)
    if (!definition || definition.role !== 'attribute') {
      errors.push({ code: 'invalid-ai', message: `AI ${ai} is not a supported query attribute.`, ai })
      continue
    }
    attributes.push({ ai, value })
  }

  if (!primaryValue) {
    errors.push({ code: 'missing-primary-identifier', message: 'AI 01 requires a GTIN value.' })
  }

  const data: DigitalLinkData = {
    primaryIdentifier: { ai: PRIMARY_AI, value: primaryValue },
    qualifiers,
    attributes,
  }
  errors.push(...validateDigitalLinkData(data))

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const domain = `${url.origin}${stemSegments.length > 0 ? `/${stemSegments.map(encodeURIComponent).join('/')}` : ''}`
  const generated = buildDigitalLink(data, domain)
  if (!generated.ok || !generated.uri) {
    return { ok: false, errors: generated.errors }
  }

  return { ok: true, data, normalizedUri: generated.uri, errors: [] }
}

function validateDigitalLinkData(data: DigitalLinkData): DigitalLinkError[] {
  const errors: DigitalLinkError[] = []
  const seenAis = new Set<string>()

  if (data.primaryIdentifier.ai !== PRIMARY_AI) {
    errors.push({ code: 'missing-primary-identifier', message: 'AI 01 must be the primary identifier.', ai: data.primaryIdentifier.ai })
  }
  validateAi('01', data.primaryIdentifier.value, errors)
  seenAis.add(data.primaryIdentifier.ai)

  for (const qualifier of data.qualifiers) {
    validateMember(qualifier, 'qualifier', seenAis, errors)
  }

  for (const attribute of data.attributes) {
    validateMember(attribute, 'attribute', seenAis, errors)
  }

  return errors
}

function validateMember(
  member: Qualifier | Attribute,
  expectedRole: AiDefinition['role'],
  seenAis: Set<string>,
  errors: DigitalLinkError[],
): void {
  if (seenAis.has(member.ai)) {
    errors.push({ code: 'duplicate-ai', message: `AI ${member.ai} occurs more than once.`, ai: member.ai })
    return
  }
  seenAis.add(member.ai)

  const definition = getAiDefinition(member.ai)
  if (!definition || definition.role !== expectedRole) {
    errors.push({ code: 'invalid-ai', message: `AI ${member.ai} is not a supported ${expectedRole}.`, ai: member.ai })
    return
  }
  validateAi(member.ai, member.value, errors)
}

function validateAi(ai: string, value: string, errors: DigitalLinkError[]): void {
  const definition = getAiDefinition(ai)
  if (!definition) {
    errors.push({ code: 'invalid-ai', message: `AI ${ai} is not supported.`, ai })
    return
  }

  if (value.length < definition.length.min || value.length > definition.length.max || !definition.validation.pattern.test(value)) {
    errors.push({ code: 'invalid-value', message: `AI ${ai} has an invalid value.`, ai })
    return
  }

  if (definition.validation.requiresCheckDigit && !validateGtin(value).valid) {
    errors.push({ code: 'invalid-value', message: `AI ${ai} has an invalid GTIN check digit.`, ai })
  }
}

function parseHttpsDomain(domain: string): URL | undefined {
  try {
    const url = new URL(domain)
    if (url.protocol !== 'https:' || url.search || url.hash) {
      return undefined
    }
    return url
  } catch {
    return undefined
  }
}

function sortForPath(qualifiers: readonly Qualifier[]): readonly Qualifier[] {
  return [...qualifiers].sort((left, right) => {
    const leftOrder = getAiDefinition(left.ai)?.serialization.pathOrder ?? Number.MAX_SAFE_INTEGER
    const rightOrder = getAiDefinition(right.ai)?.serialization.pathOrder ?? Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder
  })
}

function sortForQuery(attributes: readonly Attribute[]): readonly Attribute[] {
  return [...attributes].sort((left, right) => Number(left.ai) - Number(right.ai))
}

function decodePathValue(segment: string, errors: DigitalLinkError[], ai: string): string | undefined {
  try {
    return decodeURIComponent(segment)
  } catch {
    errors.push({ code: 'invalid-uri', message: `AI ${ai} contains invalid percent encoding.`, ai })
    return undefined
  }
}

function failure(error: DigitalLinkError): DigitalLinkParseResult {
  return { ok: false, errors: [error] }
}