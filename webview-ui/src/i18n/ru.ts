import type { Messages } from './en'

export const ru: Messages = {
  loading: 'Загрузка…',
  categoriesLabel: 'Категории команд',
  commandCount: { one: '{count} команда', few: '{count} команды', many: '{count} команд', other: '{count} команды' },
  emptyCatalog: 'Нет доступных категорий.',
  back: 'Назад',
  commandsLabel: 'Команды: {category}',
  riskCaution: 'Осторожно',
  riskDestructive: 'Опасно',
  sendToTerminalHint: 'Вставляет команду в терминал, не выполняя её',
  copyCommand: 'Копировать команду',
  copied: 'Скопировано',
  searchLabel: 'Поиск команд',
  searchPlaceholder: 'Искать во всех категориях',
  searchResultsLabel: 'Результаты поиска',
  resultCount: { one: '{count} результат', few: '{count} результата', many: '{count} результатов', other: '{count} результата' },
  noResults: 'Нет команд, соответствующих запросу.',
  examplesFor: 'Примеры для: {shell}',
}
