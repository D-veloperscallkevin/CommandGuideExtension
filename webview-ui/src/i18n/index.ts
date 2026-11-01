import { useCallback } from 'react'
import type { Locale } from '../../../src/i18n/locales'
import { de } from './de'
import { en, type MessageKey, type Messages } from './en'
import { es } from './es'
import { fr } from './fr'
import { it } from './it'
import { ja } from './ja'
import { ko } from './ko'
import { selectPlural } from './plural'
import { ptbr } from './pt-br'
import { ru } from './ru'
import { zhcn } from './zh-cn'
import { zhtw } from './zh-tw'

export type { MessageKey, Messages }
export type { PluralForms } from './plural'
export { intlLocale } from './plural'
/** Valores para los marcadores `{nombre}`. En las claves plurales, `count` elige la forma. */
export type MessageParams = Readonly<Record<string, string | number>>

// Record<Locale, …> obliga a tener un diccionario por cada idioma soportado.
export const dictionaries: Readonly<Record<Locale, Messages>> = {
  en,
  es,
  'pt-br': ptbr,
  fr,
  de,
  it,
  ja,
  ko,
  'zh-cn': zhcn,
  'zh-tw': zhtw,
  ru,
}

/** Idioma soportado a partir de un valor cualquiera (p. ej. `<html lang>`); si no lo es, `en`. */
export function toLocale(value: string | null | undefined): Locale {
  return value && Object.hasOwn(dictionaries, value) ? (value as Locale) : 'en'
}

/**
 * Texto de `key` en `locale`, sustituyendo cada `{nombre}` por `params[nombre]`. Si la
 * clave es plural, `params.count` elige la forma según las reglas del idioma.
 */
export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
  const entry = dictionaries[locale][key]
  const template = typeof entry === 'string' ? entry : selectPlural(entry, locale, Number(params?.count))
  if (!params) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  )
}

export function useT(locale: Locale) {
  return useCallback((key: MessageKey, params?: MessageParams) => translate(locale, key, params), [locale])
}
