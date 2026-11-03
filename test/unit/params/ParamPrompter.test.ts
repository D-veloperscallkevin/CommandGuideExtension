import { describe, expect, it } from 'vitest';
import { CatalogService } from '../../../src/catalog/CatalogService';
import type { Command } from '../../../src/catalog/types';
import {
	ParamPrompter,
	type ParamInputBoxOptions,
	type ParamMessages,
	type PromptWindow,
} from '../../../src/params/ParamPrompter';
import { branchParam, makeCommand } from '../catalog/fixtures';

const messages: ParamMessages = {
	empty: 'vacío',
	control: 'control',
	tooLong: 'largo',
	cmdUnsafe: 'cmd',
	powershellUnsafe: 'ps',
};

/** Ventana falsa: responde a cada cuadro con la siguiente respuesta y guarda las opciones. */
function fakeWindow(answers: (string | undefined)[]) {
	const shown: ParamInputBoxOptions[] = [];
	const window: PromptWindow = {
		showInputBox: (options) => {
			shown.push(options);
			return Promise.resolve(answers.shift());
		},
	};
	return { window, shown };
}

const catalog = new CatalogService();
const copy = catalog.getCommand('terminal.copy') as Command;
const newBranch = makeCommand({
	id: 'git.new-branch',
	title: { en: 'Create branch', es: 'Crear rama' },
	command: 'git checkout -b ${branch}',
	params: [branchParam],
});

describe('ParamPrompter', () => {
	it('un parámetro: título sin paso, etiqueta, placeholder e ignoreFocusOut', async () => {
		const { window, shown } = fakeWindow(['feature/login']);
		const values = await new ParamPrompter(window, messages).ask(newBranch, 'es', 'bash');
		expect(values).toEqual(new Map([['branch', 'feature/login']]));
		expect(shown).toHaveLength(1);
		expect(shown[0]).toMatchObject({
			title: 'Crear rama',
			prompt: 'Nombre de la rama',
			placeHolder: 'feature/mi-cambio',
			ignoreFocusOut: true,
		});
	});

	it('dos parámetros en orden, con el paso en el título', async () => {
		const { window, shown } = fakeWindow(['src', 'dst']);
		const values = await new ParamPrompter(window, messages).ask(copy, 'en', 'bash');
		expect([...(values ?? [])]).toEqual([
			['source', 'src'],
			['destination', 'dst'],
		]);
		expect(shown.map((o) => o.title)).toEqual([`${copy.title.en} (1/2)`, `${copy.title.en} (2/2)`]);
	});

	it('cancelar el segundo cuadro devuelve undefined y no abre más', async () => {
		const { window, shown } = fakeWindow(['src', undefined, 'nunca']);
		expect(await new ParamPrompter(window, messages).ask(copy, 'en', 'bash')).toBeUndefined();
		expect(shown).toHaveLength(2);
	});

	it('cancelar el primero no abre el segundo', async () => {
		const { window, shown } = fakeWindow([undefined]);
		expect(await new ParamPrompter(window, messages).ask(copy, 'en', 'bash')).toBeUndefined();
		expect(shown).toHaveLength(1);
	});

	it('validateInput devuelve el mensaje traducido según el shell', async () => {
		const { window, shown } = fakeWindow(['x']);
		await new ParamPrompter(window, messages).ask(newBranch, 'es', 'cmd');
		const validate = shown[0].validateInput;
		expect(validate('')).toBe('vacío');
		expect(validate('a\nb')).toBe('control');
		expect(validate('a'.repeat(501))).toBe('largo');
		expect(validate('100%')).toBe('cmd');
		expect(validate('feature/login')).toBeUndefined();

		const ps = fakeWindow(['x']);
		await new ParamPrompter(ps.window, messages).ask(newBranch, 'es', 'powershell');
		expect(ps.shown[0].validateInput('a "b"')).toBe('ps');
		expect(ps.shown[0].validateInput('100%')).toBeUndefined();
	});

	it('devuelve los valores recortados', async () => {
		const { window } = fakeWindow(['  feature/login  ']);
		expect(await new ParamPrompter(window, messages).ask(newBranch, 'es', 'bash')).toEqual(
			new Map([['branch', 'feature/login']]),
		);
	});

	it('un valor inválido que llegue igualmente se trata como cancelado', async () => {
		const { window } = fakeWindow(['a\nrm -rf ~']);
		expect(await new ParamPrompter(window, messages).ask(newBranch, 'es', 'bash')).toBeUndefined();
	});

	it('sin traducción usa el inglés de etiqueta y placeholder', async () => {
		const { window, shown } = fakeWindow(['x']);
		await new ParamPrompter(window, messages).ask(newBranch, 'ja', 'bash');
		expect(shown[0]).toMatchObject({ title: 'Create branch', prompt: 'Branch name', placeHolder: 'feature/my-change' });
	});

	it('sin parámetros no abre ningún cuadro', async () => {
		const { window, shown } = fakeWindow([]);
		expect(await new ParamPrompter(window, messages).ask(catalog.getCommand('git.status') as Command, 'es', 'bash')).toEqual(
			new Map(),
		);
		expect(shown).toHaveLength(0);
	});
});
