import type { InputFormatDetection } from './types'

const GROUP_SEPARATOR = String.fromCharCode(29)
const SYMBOLOGY_IDENTIFIER = /^](?:C1|e0|d2|Q3)/
const BRACKETED_ELEMENT_STRING = /^\(\d{2,4}\).+/
const NUMERIC_GTIN = /^\d{8}$|^\d{12,14}$/
const UNCOMPRESSED_PATH = /\/(?:01|00|253|255|401|402|414|417|8003|8004|8006|8010|8013|8017|8018)\/[^/]+/

export function detectInputFormat(input: string): InputFormatDetection {
  const normalizedInput = input.trim()

  if (BRACKETED_ELEMENT_STRING.test(normalizedInput)) {
    return { format: 'element-string-bracketed', normalizedInput }
  }

  if (normalizedInput.includes(GROUP_SEPARATOR) || SYMBOLOGY_IDENTIFIER.test(normalizedInput)) {
    return { format: 'element-string-fnc1', normalizedInput }
  }

  if (NUMERIC_GTIN.test(normalizedInput)) {
    return { format: 'gtin', normalizedInput }
  }

  if (isHttpUrl(normalizedInput)) {
    return {
      format: UNCOMPRESSED_PATH.test(new URL(normalizedInput).pathname)
        ? 'digital-link'
        : 'digital-link-compressed',
      normalizedInput,
    }
  }

  return { format: 'invalid', normalizedInput }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}