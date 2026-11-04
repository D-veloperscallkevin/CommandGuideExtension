// Comandos propios del usuario (ajuste `devcommands.customCommands`): convierte lo que escribe en
// categorías del catálogo y valida cada parte por separado, con las reglas del catálogo. Sin
// dependencias de `vscode` ni de Ajv: lo que no es válido se omite y se informa con un código.

import { SUPPORTED_LOCALES, type Locale } from '../i18n/locales';
import type { Category, Command, LocalizedString, LocalizedTags, Param, Risk, ShellId } from './types';
import { CUSTOM_PREFIX, paramProblems } from './validate';

/** Por qué se omitió una parte del ajuste. Cada código tiene su texto traducido en la extensión. */
export type CustomReason =
	| 'notArray'
	| 'invalidCategory'
	| 'duplicateCategory'
	| 'emptyCategory'
	| 'invalidCommand'
	| 'duplicateCommand'
	| 'invalidText'
	| 'invalidRisk'
	| 'controlChars'
	| 'tooLong'
	| 'undeclaredParam'
	| 'unusedParam'
	| 'duplicateParam'
	| 'invalidShell'
	| 'tooMany';

export interface CustomProblem {
	/** Dónde está el problema, p. ej. `customCommands[0].commands[2] (deploy)`. */
	readonly where: string;
	readonly reason: CustomReason;
	/** Dato concreto del motivo (el placeholder, el campo…), sin traducir. */
	readonly detail?: string;
}

export interface CustomResult {
	readonly categories: Category[];
	readonly problems: CustomProblem[];
}

export const MAX_CUSTOM_CATEGORIES = 50;
export const MAX_CUSTOM_COMMANDS = 200;
export const MAX_ID_LENGTH = 50;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_TEMPLATE_LENGTH = 1000;
/** Icono de una categoría propia que no declara `icon`. */
export const DEFAULT_CUSTOM_ICON = 'terminal';

const idPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const paramNamePattern = /^[A-Za-z][A-Za-z0-9_]*$/;
// La misma expresión que `escape.ts`: un salto de línea ejecutaría lo escrito antes.
const controlChars = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
const shellIds: readonly ShellId[] = ['bash', 'zsh', 'powershell', 'cmd'];
const risks: readonly Risk[] = ['safe', 'caution', 'destructive'];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

const isId = (value: unknown): value is string =>
	typeof value === 'string' && value.length <= MAX_ID_LENGTH && idPattern.test(value);

/** Excepción interna para cortar la conversión de un comando con su motivo. */
class Invalid extends Error {
	constructor(
		readonly reason: CustomReason,
		readonly detail?: string,
	) {
		super(reason);
	}
}

/** Un texto: string no vacío de hasta `max` caracteres, sin caracteres de control. */
function plainText(value: unknown, max: number): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed !== '' && trimmed.length <= max && !controlChars.test(trimmed) ? trimmed : undefined;
}

/**
 * Texto visible: un string (igual en todos los idiomas) o un objeto con al menos uno de los
 * idiomas admitidos. Se normaliza a `LocalizedString`: `en` y `es` se rellenan con el otro o con
 * el primero declarado, así que `localize` usa el idioma activo, después `en`.
 */
function localizedText(value: unknown, max: number, field: string): LocalizedString {
	const simple = plainText(value, max);
	if (simple !== undefined) {
		return { en: simple, es: simple };
	}
	if (!isPlainObject(value)) {
		throw new Invalid('invalidText', field);
	}
	const texts: Partial<Record<Locale, string>> = {};
	for (const [key, raw] of Object.entries(value)) {
		const text = plainText(raw, max);
		if (!(SUPPORTED_LOCALES as readonly string[]).includes(key) || text === undefined) {
			throw new Invalid('invalidText', field);
		}
		texts[key as Locale] = text;
	}
	const first = Object.values(texts)[0];
	if (first === undefined) {
		throw new Invalid('invalidText', field);
	}
	return { ...texts, en: texts.en ?? texts.es ?? first, es: texts.es ?? texts.en ?? first };
}

/** Tags: una lista de textos o un objeto con una lista por idioma. Lo que no es válido se ignora. */
function localizedTags(value: unknown): LocalizedTags {
	const list = (raw: unknown): string[] =>
		Array.isArray(raw) ? raw.flatMap((t) => plainText(t, MAX_TITLE_LENGTH) ?? []) : [];
	if (Array.isArray(value)) {
		const tags = list(value);
		return { en: tags, es: tags };
	}
	if (!isPlainObject(value)) {
		return { en: [], es: [] };
	}
	const tags: Partial<Record<Locale, string[]>> = {};
	for (const [key, raw] of Object.entries(value)) {
		if ((SUPPORTED_LOCALES as readonly string[]).includes(key)) {
			tags[key as Locale] = list(raw);
		}
	}
	const first = Object.values(tags)[0] ?? [];
	return { ...tags, en: tags.en ?? tags.es ?? first, es: tags.es ?? tags.en ?? first };
}

/** Plantilla: string no vacío de hasta MAX_TEMPLATE_LENGTH, sin saltos de línea ni control. */
function template(value: unknown, field: string): string {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Invalid('invalidCommand', field);
	}
	if (controlChars.test(value)) {
		throw new Invalid('controlChars', field);
	}
	if (value.length > MAX_TEMPLATE_LENGTH) {
		throw new Invalid('tooLong', field);
	}
	return value;
}

function param(value: unknown, index: number): Param {
	if (!isPlainObject(value) || typeof value.name !== 'string' || !paramNamePattern.test(value.name)) {
		throw new Invalid('invalidCommand', `params[${index}]`);
	}
	return {
		name: value.name,
		label: localizedText(value.label, MAX_TITLE_LENGTH, `params[${index}].label`),
		placeholder: localizedText(value.placeholder, MAX_TITLE_LENGTH, `params[${index}].placeholder`),
	};
}

/** Convierte un comando del ajuste; lanza `Invalid` con el motivo si no es válido. */
function command(value: unknown, categoryId: string): Command {
	if (!isPlainObject(value) || !isId(value.id)) {
		throw new Invalid('invalidCommand', 'id');
	}
	const risk = value.risk ?? 'safe';
	if (!risks.includes(risk as Risk)) {
		throw new Invalid('invalidRisk', String(risk));
	}
	let shells: Partial<Record<ShellId, string>> | undefined;
	if (value.shells !== undefined) {
		if (!isPlainObject(value.shells)) {
			throw new Invalid('invalidShell');
		}
		shells = {};
		for (const [key, raw] of Object.entries(value.shells)) {
			if (!shellIds.includes(key as ShellId)) {
				throw new Invalid('invalidShell', key);
			}
			shells[key as ShellId] = template(raw, `shells.${key}`);
		}
	}
	if (value.params !== undefined && !Array.isArray(value.params)) {
		throw new Invalid('invalidCommand', 'params');
	}
	const title = localizedText(value.title, MAX_TITLE_LENGTH, 'title');
	const cmd: Command = {
		id: `${categoryId}.${value.id}`,
		title,
		// Sin descripción, la lista no muestra ninguna (la línea vacía se oculta con CSS).
		description:
			value.description === undefined
				? { en: '', es: '' }
				: localizedText(value.description, MAX_DESCRIPTION_LENGTH, 'description'),
		command: template(value.command, 'command'),
		...(value.params === undefined ? {} : { params: (value.params as unknown[]).map(param) }),
		tags: localizedTags(value.tags),
		risk: risk as Risk,
		...(shells === undefined ? {} : { shells }),
	};
	const [problem] = paramProblems(cmd);
	if (problem) {
		throw new Invalid(problem.code, problem.code === 'duplicateParam' ? problem.names.join(', ') : problem.name);
	}
	return cmd;
}

/**
 * Categorías propias válidas del ajuste, con ids internos `custom-<id>` y `custom-<id>.<id>`, en el
 * orden del ajuste, y los problemas de lo que se omitió. Un valor que no es una lista da cero
 * categorías y un problema.
 */
export function parseCustomCommands(value: unknown): CustomResult {
	const categories: Category[] = [];
	const problems: CustomProblem[] = [];
	if (value === undefined || value === null) {
		return { categories, problems };
	}
	if (!Array.isArray(value)) {
		return { categories, problems: [{ where: 'customCommands', reason: 'notArray' }] };
	}
	const seenCategories = new Set<string>();
	let commandCount = 0;
	value.forEach((raw, ci) => {
		const at = `customCommands[${ci}]`;
		if (ci >= MAX_CUSTOM_CATEGORIES) {
			problems.push({ where: at, reason: 'tooMany' });
			return;
		}
		if (!isPlainObject(raw) || !isId(raw.id) || !Array.isArray(raw.commands)) {
			problems.push({ where: at, reason: 'invalidCategory' });
			return;
		}
		const where = `${at} (${raw.id})`;
		if (seenCategories.has(raw.id)) {
			problems.push({ where, reason: 'duplicateCategory' });
			return;
		}
		seenCategories.add(raw.id);
		let title: LocalizedString;
		try {
			title = localizedText(raw.title, MAX_TITLE_LENGTH, 'title');
		} catch {
			problems.push({ where, reason: 'invalidCategory', detail: 'title' });
			return;
		}
		const categoryId = `${CUSTOM_PREFIX}${raw.id}`;
		const commands: Command[] = [];
		const seenCommands = new Set<string>();
		(raw.commands as unknown[]).forEach((rawCommand, i) => {
			const id = isPlainObject(rawCommand) && typeof rawCommand.id === 'string' ? rawCommand.id : undefined;
			const commandWhere = `${at}.commands[${i}]${id === undefined ? '' : ` (${id})`}`;
			if (commandCount >= MAX_CUSTOM_COMMANDS) {
				problems.push({ where: commandWhere, reason: 'tooMany' });
				return;
			}
			try {
				const cmd = command(rawCommand, categoryId);
				if (seenCommands.has(cmd.id)) {
					problems.push({ where: commandWhere, reason: 'duplicateCommand' });
					return;
				}
				seenCommands.add(cmd.id);
				commands.push(cmd);
				commandCount++;
			} catch (error) {
				if (!(error instanceof Invalid)) {
					throw error;
				}
				problems.push({ where: commandWhere, reason: error.reason, ...(error.detail === undefined ? {} : { detail: error.detail }) });
			}
		});
		if (commands.length === 0) {
			problems.push({ where, reason: 'emptyCategory' });
			return;
		}
		categories.push({
			version: 1,
			id: categoryId,
			title,
			icon: typeof raw.icon === 'string' && idPattern.test(raw.icon) ? raw.icon : DEFAULT_CUSTOM_ICON,
			// Las propias van tras las del catálogo en el orden del ajuste (ver CatalogService).
			order: ci,
			commands,
		});
	});
	return { categories, problems };
}
