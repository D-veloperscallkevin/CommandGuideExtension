import { describe, expect, expectTypeOf, it } from 'vitest';
import { isWebviewMessage, MAX_COMMAND_ID_LENGTH, type ExtensionMessage, type HistoryItem, type ShellId } from '../../../src/messaging/protocol';

describe('isWebviewMessage', () => {
	it('acepta ready', () => {
		expect(isWebviewMessage({ type: 'ready' })).toBe(true);
	});

	it.each([
		['null', null],
		['undefined', undefined],
		['un string', 'ready'],
		['un número', 1],
		['un array', [{ type: 'ready' }]],
		['un objeto sin type', {}],
		['un type no string', { type: 1 }],
		['un tipo desconocido', { type: 'runShell', cmd: 'rm -rf /' }],
		['un tipo heredado de Object', { type: 'toString' }],
		['propiedades extra', { type: 'ready', extra: 1 }],
		['un objeto con prototipo propio', Object.assign(Object.create({ evil: true }), { type: 'ready' })],
	])('rechaza %s', (_name, value) => {
		expect(isWebviewMessage(value)).toBe(false);
	});

	describe.each(['sendToTerminal', 'copyToClipboard', 'toggleFavorite'] as const)('%s', (type) => {
		it('acepta un commandId válido', () => {
			expect(isWebviewMessage({ type, commandId: 'git.status' })).toBe(true);
			expect(isWebviewMessage({ type, commandId: 'x'.repeat(MAX_COMMAND_ID_LENGTH) })).toBe(true);
		});

		it.each([
			['sin commandId', {}],
			['commandId numérico', { commandId: 42 }],
			['commandId nulo', { commandId: null }],
			['commandId vacío', { commandId: '' }],
			['commandId demasiado largo', { commandId: 'x'.repeat(MAX_COMMAND_ID_LENGTH + 1) }],
			['texto arbitrario extra', { commandId: 'git.status', text: 'rm -rf /' }],
			['estado de favorito extra', { commandId: 'git.status', favorite: true }],
		])('rechaza %s', (_name, fields) => {
			expect(isWebviewMessage({ type, ...fields })).toBe(false);
		});
	});

	describe.each(['sendRecent', 'copyRecent'] as const)('%s', (type) => {
		const uuid = '3f2a9c1e-0b7d-4e6a-9c51-2d8f7a1b4e60';

		it('acepta la clave de una entrada', () => {
			expect(isWebviewMessage({ type, entryId: uuid })).toBe(true);
			expect(isWebviewMessage({ type, entryId: 'a'.repeat(64) })).toBe(true);
		});

		it.each([
			['sin entryId', {}],
			['entryId numérico', { entryId: 7 }],
			['entryId vacío', { entryId: '' }],
			['entryId de 65 caracteres', { entryId: 'a'.repeat(65) }],
			['entryId con /', { entryId: 'a/b' }],
			['valores de más', { entryId: uuid, values: { branch: 'main' } }],
			['commandId en lugar de entryId', { commandId: 'git.status' }],
		])('rechaza %s', (_name, fields) => {
			expect(isWebviewMessage({ type, ...fields })).toBe(false);
		});
	});

	it('acepta clearHistory y rechaza sus campos de más', () => {
		expect(isWebviewMessage({ type: 'clearHistory' })).toBe(true);
		expect(isWebviewMessage({ type: 'clearHistory', entryId: 'a1' })).toBe(false);
	});

	it('rechaza commandId en ready', () => {
		expect(isWebviewMessage({ type: 'ready', commandId: 'git.status' })).toBe(false);
	});
});

describe('ExtensionMessage', () => {
	it('catalog lleva el shell de los ejemplos', () => {
		expectTypeOf<Extract<ExtensionMessage, { type: 'catalog' }>['shell']>().toEqualTypeOf<ShellId>();
	});

	it('favorites lleva solo la lista de ids', () => {
		expectTypeOf<Extract<ExtensionMessage, { type: 'favorites' }>>().toEqualTypeOf<{
			readonly type: 'favorites';
			readonly commandIds: readonly string[];
		}>();
	});

	it('history lleva solo las entradas, con clave, comando y texto', () => {
		expectTypeOf<Extract<ExtensionMessage, { type: 'history' }>>().toEqualTypeOf<{
			readonly type: 'history';
			readonly entries: readonly HistoryItem[];
		}>();
		expectTypeOf<HistoryItem>().toEqualTypeOf<{
			readonly id: string;
			readonly commandId: string;
			readonly text: string;
			readonly needsInput: boolean;
		}>();
	});

	it('copied puede llevar la clave de la entrada copiada', () => {
		expectTypeOf<Extract<ExtensionMessage, { type: 'copied' }>['entryId']>().toEqualTypeOf<string | undefined>();
	});
});
