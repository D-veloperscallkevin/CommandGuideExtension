import { describe, expect, it } from 'vitest';
import { isWebviewMessage, MAX_COMMAND_ID_LENGTH } from '../../../src/messaging/protocol';

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

	describe('sendToTerminal', () => {
		it('acepta un commandId válido', () => {
			expect(isWebviewMessage({ type: 'sendToTerminal', commandId: 'git.status' })).toBe(true);
			expect(isWebviewMessage({ type: 'sendToTerminal', commandId: 'x'.repeat(MAX_COMMAND_ID_LENGTH) })).toBe(true);
		});

		it.each([
			['sin commandId', { type: 'sendToTerminal' }],
			['commandId numérico', { type: 'sendToTerminal', commandId: 42 }],
			['commandId nulo', { type: 'sendToTerminal', commandId: null }],
			['commandId vacío', { type: 'sendToTerminal', commandId: '' }],
			['commandId demasiado largo', { type: 'sendToTerminal', commandId: 'x'.repeat(MAX_COMMAND_ID_LENGTH + 1) }],
			['texto arbitrario extra', { type: 'sendToTerminal', commandId: 'git.status', text: 'rm -rf /' }],
			['commandId en ready', { type: 'ready', commandId: 'git.status' }],
		])('rechaza %s', (_name, value) => {
			expect(isWebviewMessage(value)).toBe(false);
		});
	});
});
