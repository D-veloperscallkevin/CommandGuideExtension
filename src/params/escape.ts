// Escapado de los valores de los parámetros según el shell de destino y el contexto de comillas
// de cada `${x}` en la plantilla. Funciones puras: no dependen de `vscode`.

import { effectiveCommand } from '../catalog/CatalogService';
import type { Command, ShellId } from '../catalog/types';

/**
 * Dónde está un `${x}` dentro de la plantilla. `nestedSingle` solo existe en cmd: comillas
 * simples dentro de comillas dobles, es decir, una cadena de PowerShell incrustada en un
 * `powershell -Command "…"`.
 */
export type QuoteContext = 'bare' | 'double' | 'single' | 'nestedSingle';

export interface PlaceholderSite {
	readonly name: string;
	/** Posición del `$` en la plantilla. */
	readonly start: number;
	/** Posición siguiente a la `}`. */
	readonly end: number;
	readonly context: QuoteContext;
}

const placeholderAt = /\$\{([A-Za-z][A-Za-z0-9_]*)\}/y;

/** Cada `${x}` de la plantilla con su contexto de comillas, en orden de aparición. */
export function quoteContexts(template: string, shell: ShellId): PlaceholderSite[] {
	const sites: PlaceholderSite[] = [];
	let state: QuoteContext = 'bare';
	for (let i = 0; i < template.length; i++) {
		placeholderAt.lastIndex = i;
		const match = placeholderAt.exec(template);
		if (match) {
			sites.push({ name: match[1], start: i, end: i + match[0].length, context: state });
			i += match[0].length - 1;
			continue;
		}
		const ch = template[i];
		if (shell === 'cmd') {
			// En cmd solo delimita `"`; una `'` solo cuenta dentro de comillas dobles (PowerShell incrustado).
			if (ch === '"') {
				state = state === 'bare' ? 'double' : 'bare';
			} else if (ch === "'" && state !== 'bare') {
				state = state === 'double' ? 'nestedSingle' : 'double';
			}
		} else if (state === 'bare') {
			if (ch === "'") {state = 'single';}
			else if (ch === '"') {state = 'double';}
		} else if ((state === 'single' && ch === "'") || (state === 'double' && ch === '"')) {
			state = 'bare';
		}
	}
	return sites;
}

/** Longitud máxima de un valor, ya sin los espacios de los extremos. */
export const MAX_VALUE_LENGTH = 500;

export type ValueError = 'empty' | 'control' | 'tooLong' | 'cmdUnsafe' | 'powershellUnsafe';

// Saltos de línea y caracteres de control: un salto de línea ejecutaría el comando.
const controlChars = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;

/**
 * Motivo por el que un valor no se acepta en ningún shell (caracteres de control, vacío o
 * demasiado largo), o `undefined` si puede valer en alguno.
 */
export function basicValueError(value: string): 'control' | 'empty' | 'tooLong' | undefined {
	if (controlChars.test(value)) {return 'control';}
	const trimmed = value.trim();
	if (trimmed === '') {return 'empty';}
	if (trimmed.length > MAX_VALUE_LENGTH) {return 'tooLong';}
	return undefined;
}

/** Motivo por el que un valor tecleado no se acepta para ese shell, o `undefined` si es válido. */
export function validateValue(value: string, shell: ShellId): ValueError | undefined {
	const basic = basicValueError(value);
	if (basic) {return basic;}
	const trimmed = value.trim();
	// cmd no puede escapar `"` dentro de comillas ni evitar la expansión de `%VAR%` en interactivo.
	if (shell === 'cmd' && /["%]/.test(trimmed)) {return 'cmdUnsafe';}
	// Windows PowerShell 5.1 borra las `"` de un argumento al pasarlo a un programa nativo (git, node…).
	if (shell === 'powershell' && trimmed.includes('"')) {return 'powershellUnsafe';}
	return undefined;
}

/** Valores que cada shell recibe como un único argumento literal sin comillas. */
const safeBare: Readonly<Record<ShellId, RegExp>> = {
	// `~` y `=` al inicio de una palabra los expanden bash y zsh.
	bash: /^[A-Za-z0-9_./-][A-Za-z0-9_./:@%+=,-]*$/,
	zsh: /^[A-Za-z0-9_./-][A-Za-z0-9_./:@%+=,-]*$/,
	// `,` crea un array; `-` y `@` al inicio son nombre de parámetro y splatting.
	powershell: /^[A-Za-z0-9_./\\][A-Za-z0-9_./\\:@%+=-]*$/,
	// `=`, `,` y `;` separan argumentos en cmd.
	cmd: /^[A-Za-z0-9_./\\:@+-]+$/,
};

// PowerShell trata las comillas tipográficas igual que las rectas.
const psSingleQuotes = /['\u2018\u2019\u201a\u201b]/g;
const psDoubleQuoteOrSpecial = /[`$"\u201c\u201d\u201e]/g;

const posixSingle = (value: string): string => value.replace(/'/g, "'\\''");

/**
 * Duplica las `\` finales. Los programas nativos de Windows leen `\"` como una comilla escapada,
 * así que `"C:\mi dir\"` les llegaría como `C:\mi dir"`.
 */
const doubleTrailingBackslashes = (value: string): string => value.replace(/\\+$/, '$&$&');

/** El valor listo para insertarlo en ese contexto de la plantilla de ese shell. */
export function escapeValue(value: string, shell: ShellId, context: QuoteContext): string {
	if (context === 'bare' && safeBare[shell].test(value)) {
		return value;
	}
	switch (shell) {
		case 'bash':
		case 'zsh':
			if (context === 'double') {
				// `!` dispara el historial y `\!` deja la barra: se escribe fuera de las comillas dobles.
				return value.replace(/[\\"$`]/g, '\\$&').replace(/!/g, `"'!'"`);
			}
			return context === 'bare' ? `'${posixSingle(value)}'` : posixSingle(value);
		case 'powershell':
			// Para un programa nativo, PowerShell entrecomilla los argumentos que tienen espacios.
			if (/\s/.test(value)) {
				value = doubleTrailingBackslashes(value);
			}
			if (context === 'double') {
				return value.replace(psDoubleQuoteOrSpecial, '`$&');
			}
			return context === 'bare'
				? `'${value.replace(psSingleQuotes, '$&$&')}'`
				: value.replace(psSingleQuotes, '$&$&');
		case 'cmd':
			// `"` y `%` ya los rechaza validateValue.
			if (context === 'nestedSingle') {
				return value.replace(psSingleQuotes, '$&$&');
			}
			return context === 'bare' ? `"${doubleTrailingBackslashes(value)}"` : doubleTrailingBackslashes(value);
	}
}

/**
 * Texto del comando para ese shell con cada `${x}` sustituido por su valor escapado según su
 * contexto. Los valores deben estar ya validados y recortados.
 */
export function buildCommandText(command: Command, shell: ShellId, values: ReadonlyMap<string, string>): string {
	const template = effectiveCommand(command, shell);
	let text = '';
	let last = 0;
	for (const site of quoteContexts(template, shell)) {
		const value = values.get(site.name);
		if (value === undefined) {
			throw new Error(`Falta el valor de "${site.name}" en ${command.id}`);
		}
		text += template.slice(last, site.start) + escapeValue(value, shell, site.context);
		last = site.end;
	}
	return text + template.slice(last);
}
