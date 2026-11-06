import { describe, expect, it, vi } from 'vitest';
import { openSponsor, sponsorUrl } from '../../../src/sponsor/sponsorLink';

const URL_ = 'https://github.com/sponsors/D-veloperscallkevin';

function fakeLog() {
	return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe('sponsorUrl', () => {
	it('devuelve la URL de GitHub Sponsors del manifiesto', () => {
		expect(sponsorUrl({ sponsor: { url: URL_ } })).toBe(URL_);
	});

	it.each([
		['http', { sponsor: { url: 'http://github.com/sponsors/x' } }],
		['otro dominio', { sponsor: { url: 'https://example.com/sponsors/x' } }],
		['prefijo engañoso', { sponsor: { url: 'https://github.com/sponsorsX' } }],
		['github sin sponsors', { sponsor: { url: 'https://github.com/D-veloperscallkevin' } }],
		['solo el prefijo', { sponsor: { url: 'https://github.com/sponsors/' } }],
		['un número', { sponsor: { url: 42 } }],
		['sin url', { sponsor: {} }],
		['sin sponsor', {}],
		['null', null],
		['undefined', undefined],
	])('%s → undefined', (_name, pkg) => {
		expect(sponsorUrl(pkg)).toBeUndefined();
	});
});

describe('openSponsor', () => {
	it('abre exactamente la URL dada', async () => {
		const openExternal = vi.fn(async (_target: string) => true);
		const log = fakeLog();
		await openSponsor({ url: URL_, openExternal, parse: (u) => `uri:${u}`, log });
		expect(openExternal).toHaveBeenCalledTimes(1);
		expect(openExternal).toHaveBeenCalledWith(`uri:${URL_}`);
		expect(log.warn).not.toHaveBeenCalled();
		expect(log.error).not.toHaveBeenCalled();
	});

	it('sin URL no abre nada y registra una advertencia', async () => {
		const openExternal = vi.fn(async () => true);
		const log = fakeLog();
		await openSponsor({ url: undefined, openExternal, parse: (u) => u, log });
		expect(openExternal).not.toHaveBeenCalled();
		expect(log.warn).toHaveBeenCalledTimes(1);
	});

	it('si no se abre (cancelado) lo registra como información', async () => {
		const log = fakeLog();
		await openSponsor({ url: URL_, openExternal: async () => false, parse: (u) => u, log });
		expect(log.info).toHaveBeenCalledTimes(1);
		expect(log.error).not.toHaveBeenCalled();
	});

	it('si falla no lanza y lo registra como error', async () => {
		const log = fakeLog();
		await expect(
			openSponsor({ url: URL_, openExternal: async () => Promise.reject(new Error('bloqueado')), parse: (u) => u, log }),
		).resolves.toBeUndefined();
		expect(log.error).toHaveBeenCalledTimes(1);
	});
});
