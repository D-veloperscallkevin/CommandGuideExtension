import type { Messages } from './en'

export const it: Messages = {
  loading: 'Caricamento…',
  categoriesLabel: 'Categorie di comandi',
  commandCount: { one: '{count} comando', many: '{count} di comandi', other: '{count} comandi' },
  emptyCatalog: 'Nessuna categoria disponibile.',
  back: 'Indietro',
  commandsLabel: 'Comandi di {category}',
  riskCaution: 'Attenzione',
  riskDestructive: 'Distruttivo',
  sendToTerminalHint: 'Scrive il comando nel terminale senza eseguirlo',
  copyCommand: 'Copia comando',
  copied: 'Copiato',
  searchLabel: 'Cerca comandi',
  searchPlaceholder: 'Cerca in tutte le categorie',
  searchResultsLabel: 'Risultati della ricerca',
  resultCount: { one: '{count} risultato', many: '{count} di risultati', other: '{count} risultati' },
  noResults: 'Nessun comando corrisponde alla ricerca.',
  examplesFor: 'Esempi per: {shell}',
}
