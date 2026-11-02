import { describe, expect, expectTypeOf, it } from 'vitest';
import { isWebviewMessage, MAX_COMMAND_ID_LENGTH, type ExtensionMessage, type ShellId } from '../../../src/messaging/protocol';

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

	describe.each(['sendToTerminal', 'copyToClipboard'] as const)('%s', (type) => {
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
		])('rechaza %s', (_name, fields) => {
			expect(isWebviewMessage({ type, ...fields })).toBe(false);
		});
	});

	it('rechaza commandId en ready', () => {
		expect(isWebviewMessage({ type: 'ready', commandId: 'git.status' })).toBe(false);
	});
});

describe('ExtensionMessage', () => {
	it('catalog lleva el shell de los ejemplos', () => {
		expectTypeOf<Extract<ExtensionMessage, { type: 'catalog' }>['shell']>().toEqualTypeOf<ShellId>();
	});
});
