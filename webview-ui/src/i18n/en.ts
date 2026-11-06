import type { PluralForms } from './plural'

// Diccionario fuente: sus claves definen las de todos los idiomas. Una clave plural es un
// objeto con las categorías de Intl.PluralRules que necesita cada idioma (siempre "other").
export const en = {
  loading: 'Loading…',
  categoriesLabel: 'Command categories',
  commandCount: { one: '{count} command', other: '{count} commands' },
  emptyCatalog: 'No categories available.',
  back: 'Back',
  commandsLabel: 'Commands in {category}',
  riskCaution: 'Caution',
  riskDestructive: 'Destructive',
  sendToTerminalHint: 'Writes the command in the terminal without running it',
  copyCommand: 'Copy command',
  copied: 'Copied',
  searchLabel: 'Search commands',
  searchPlaceholder: 'Search in all categories',
  searchResultsLabel: 'Search results',
  resultCount: { one: '{count} result', other: '{count} results' },
  noResults: 'No commands match your search.',
  terminalIndicator: 'Terminal: {shell}',
  sponsor: 'Sponsor',
  sponsorLabel: 'Sponsor DevCommands Guide on GitHub (opens in the browser)',
  favorites: 'Favorites',
  favorite: 'Favorite',
  addedToFavorites: 'Added to favorites',
  removedFromFavorites: 'Removed from favorites',
  favoritesLabel: 'Favorite commands',
  noFavorites: 'No favorites yet. Use the star next to a command to add it.',
  recent: 'Recent',
  inThisProject: 'In this project',
  allCategories: 'All',
  shortcutsLabel: 'Shortcuts',
  recentLabel: 'Recent commands',
  noRecent: 'No recent commands yet. Commands you write to the terminal appear here.',
  clearHistory: 'Clear history',
  needsInput: "Not valid in {shell}: you'll be asked for the value when you send it.",
} satisfies Record<string, string | PluralForms>

export type MessageKey = keyof typeof en

/** Las claves de texto son string en todos los idiomas; las plurales, PluralForms. */
export type Messages = {
  [K in MessageKey]: (typeof en)[K] extends string ? string : PluralForms
}
