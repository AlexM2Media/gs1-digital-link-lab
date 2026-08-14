import en from './en.json'
import es from './es.json'

export type Locale = 'es' | 'en'
type Dictionary = typeof es
const dictionaries: Record<Locale, Dictionary> = { es, en }

export function detectLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function translate(locale: Locale, key: keyof Dictionary): string {
  return dictionaries[locale][key]
}