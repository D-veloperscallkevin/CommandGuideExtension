import type { Locale } from '../../../src/i18n/locales'

/** Formas de un texto plural: las categorías de Intl.PluralRules del idioma, con "other" siempre presente. */
export type PluralForms = Readonly<Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }>

/** Etiqueta BCP 47 para Intl a partir de los ids propios (pt-br -> pt-BR, zh-tw -> zh-TW). */
export function intlLocale(locale: Locale): string {
  const [language, region] = locale.split('-')
  return region ? `${language}-${region.toUpperCase()}` : language
}

/** Forma que corresponde a `count` en `locale`; si el diccionario no la tiene, "other". */
export function selectPlural(forms: PluralForms, locale: Locale, count: number): string {
  const category = new Intl.PluralRules(intlLocale(locale)).select(count)
  return forms[category] ?? forms.other
}
