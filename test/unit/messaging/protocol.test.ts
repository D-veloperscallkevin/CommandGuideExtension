import { describe, expect, it } from 'vitest';
import { isWebviewMessage } from '../../../src/messaging/protocol';

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
});
