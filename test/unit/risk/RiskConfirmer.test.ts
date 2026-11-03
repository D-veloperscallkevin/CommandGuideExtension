import { describe, expect, it } from 'vitest';
import { CatalogService } from '../../../src/catalog/CatalogService';
import type { Command } from '../../../src/catalog/types';
import {
	RiskConfirmer,
	type ConfirmWindow,
	type RiskMessageOptions,
	type RiskMessages,
} from '../../../src/risk/RiskConfirmer';

const messages: RiskMessages = {
	message: (title) => `«${title}» es destructivo`,
	sendDetail: (text) => `enviar: ${text}`,
	copyDetail: (text) => `copiar: ${text}`,
	sendButton: 'Escribir',
	copyButton: 'Copiar',
};

interface Shown {
	readonly message: string;
	readonly options: RiskMessageOptions;
	readonly items: readonly string[];
}

/** Ventana falsa: responde a cada aviso con `answer` (o con el botón ofrecido) y guarda lo mostrado. */
function fakeWindow(answer: 'button' | string | undefined) {
	const shown: Shown[] = [];
	const window: ConfirmWindow = {
		showWarningMessage: (message, options, ...items) => {
			shown.push({ message, options, items });
			return Promise.resolve(answer === 'button' ? items[0] : answer);
		},
	};
	return { window, shown };
}

const catalog = new CatalogService();
const command = (id: string) => catalog.getCommand(id) as Command;

describe('RiskConfirmer', () => {
	it('safe y caution: sigue sin mostrar nada', async () => {
		const { window, shown } = fakeWindow(undefined);
		const confirmer = new RiskConfirmer(window, () => true, messages);
		expect(await confirmer.confirm(command('git.status'), 'es', 'git status', 'send')).toBe(true);
		expect(await confirmer.confirm(command('git.amend'), 'es', 'git commit --amend --no-edit', 'copy')).toBe(true);
		expect(shown).toHaveLength(0);
	});

	it('destructive al enviar: aviso modal con el título localizado, el texto y el botón de enviar', async () => {
		const { window, shown } = fakeWindow('button');
		const confirmer = new RiskConfirmer(window, () => true, messages);
		expect(await confirmer.confirm(command('git.reset-hard'), 'es', 'git reset --hard', 'send')).toBe(true);
		expect(shown).toEqual([
			{
				message: '«Descartar todos los cambios locales» es destructivo',
				options: { modal: true, detail: 'enviar: git reset --hard' },
				items: ['Escribir'],
			},
		]);
	});

	it('destructive al copiar: detalle y botón de copiar', async () => {
		const { window, shown } = fakeWindow('button');
		const confirmer = new RiskConfirmer(window, () => true, messages);
		expect(await confirmer.confirm(command('docker.system-prune'), 'en', 'docker system prune -a', 'copy')).toBe(true);
		expect(shown[0].options.detail).toBe('copiar: docker system prune -a');
		expect(shown[0].items).toEqual(['Copiar']);
	});

	it('cancelar o cerrar el aviso devuelve false', async () => {
		const { window } = fakeWindow(undefined);
		const confirmer = new RiskConfirmer(window, () => true, messages);
		expect(await confirmer.confirm(command('git.clean'), 'es', 'git clean -fd', 'send')).toBe(false);
	});

	it('una respuesta distinta del botón de la acción devuelve false', async () => {
		const { window } = fakeWindow('Copiar');
		const confirmer = new RiskConfirmer(window, () => true, messages);
		expect(await confirmer.confirm(command('git.clean'), 'es', 'git clean -fd', 'send')).toBe(false);
	});

	it('con el ajuste desactivado sigue sin mostrar nada', async () => {
		const { window, shown } = fakeWindow(undefined);
		const confirmer = new RiskConfirmer(window, () => false, messages);
		expect(await confirmer.confirm(command('git.reset-hard'), 'es', 'git reset --hard', 'send')).toBe(true);
		expect(shown).toHaveLength(0);
	});

	it('consulta el ajuste en cada llamada', async () => {
		const { window, shown } = fakeWindow(undefined);
		let enabled = true;
		const confirmer = new RiskConfirmer(window, () => enabled, messages);
		expect(await confirmer.confirm(command('git.reset-hard'), 'es', 'git reset --hard', 'send')).toBe(false);
		enabled = false;
		expect(await confirmer.confirm(command('git.reset-hard'), 'es', 'git reset --hard', 'send')).toBe(true);
		expect(shown).toHaveLength(1);
	});
});
