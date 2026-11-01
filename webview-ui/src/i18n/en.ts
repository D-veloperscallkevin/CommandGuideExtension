import type { PluralForms } from './plural'

// Diccionario fuente: sus claves definen las de todos los idiomas. Una clave plural es un
// objeto con las categorías de Intl.PluralRules que necesita cada idioma (siempre "other").
export const en = {
  loading: 'Loading…',
  categoriesLabel: 'Command categories',
  commandCount: { one: '{count} command', other: '{count} commands' },
  emptyCatalog: 'No categories available.',
  back: 'Back',
  categoryPlaceholder: 'The command list for this category is coming soon.',
} satisfies Record<string, string | PluralForms>

export type MessageKey = keyof typeof en

/** Las claves de texto son string en todos los idiomas; las plurales, PluralForms. */
export type Messages = {
  [K in MessageKey]: (typeof en)[K] extends string ? string : PluralForms
}
