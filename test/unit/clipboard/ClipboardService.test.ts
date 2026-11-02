import { describe, expect, it } from 'vitest';
import { ClipboardService, type ClipboardLike } from '../../../src/clipboard/ClipboardService';

describe('ClipboardService', () => {
	it('copia el texto exacto y devuelve true', async () => {
		const written: string[] = [];
		const clipboard: ClipboardLike = {
			writeText: async (value) => {
				written.push(value);
			},
		};
		await expect(new ClipboardService(clipboard).copy('git status')).resolves.toBe(true);
		expect(written).toEqual(['git status']);
	});

	it('si el portapapeles falla, devuelve false sin lanzar', async () => {
		const clipboard: ClipboardLike = {
			writeText: () => Promise.reject(new Error('portapapeles no disponible')),
		};
		await expect(new ClipboardService(clipboard).copy('git status')).resolves.toBe(false);
	});
});
