import { describe, expect, it } from 'vitest';
import { localize } from '../../../src/catalog/CatalogService';
import {
	MAX_CUSTOM_CATEGORIES,
	MAX_CUSTOM_COMMANDS,
	MAX_TEMPLATE_LENGTH,
	parseCustomCommands,
} from '../../../src/catalog/custom';

const deploy = { id: 'deploy', title: 'Desplegar', command: 'pnpm run deploy' };
const category = (commands: unknown[], extra: Record<string, unknown> = {}) => ({
	id: 'mi-proyecto',
	title: 'Mi proyecto',
	commands,
	...extra,
});
/** Motivos de los problemas de un ajuste. */
const reasons = (value: unknown) => parseCustomCommands(value).problems.map((p) => p.reason);
/** Ids de los comandos válidos de un ajuste. */
const commandIds = (value: unknown) => parseCustomCommands(value).categories.flatMap((c) => c.commands.map((cmd) => cmd.id));

describe('parseCustomCommands', () => {
	it('sin ajuste no hay categorías ni problemas', () => {
		expect(parseCustomCommands(undefined)).toEqual({ categories: [], problems: [] });
		expect(parseCustomCommands([])).toEqual({ categories: [], problems: [] });
	});

	it.each([42, 'x', { id: 'a' }])('un valor que no es lista (%j) da un problema', (value) => {
		expect(parseCustomCommands(value)).toEqual({
			categories: [],
			problems: [{ where: 'customCommands', reason: 'notArray' }],
		});
	});

	it('categoría mínima: ids custom-, sección custom, icono terminal, riesgo safe y sin descripción', () => {
		const { categories, problems } = parseCustomCommands([category([deploy])]);
		expect(problems).toEqual([]);
		expect(categories).toHaveLength(1);
		const [cat] = categories;
		expect(cat).toMatchObject({
			id: 'custom-mi-proyecto',
			icon: 'terminal',
			section: 'custom',
			title: { en: 'Mi proyecto', es: 'Mi proyecto' },
		});
		expect(cat.commands[0]).toMatchObject({
			id: 'custom-mi-proyecto.deploy',
			command: 'pnpm run deploy',
			risk: 'safe',
			description: { en: '', es: '' },
		});
	});

	it('conserva el icono, el riesgo, los parámetros y las variantes por shell', () => {
		const [cat] = parseCustomCommands([
			category(
				[
					{
						id: 'ssh',
						title: 'Conectar',
						command: 'ssh ${host}',
						params: [{ name: 'host', label: 'Servidor', placeholder: 'mi-servidor' }],
						shells: { powershell: 'ssh.exe ${host}' },
						risk: 'caution',
					},
				],
				{ icon: 'rocket' },
			),
		]).categories;
		expect(cat.icon).toBe('rocket');
		expect(cat.commands[0]).toMatchObject({ risk: 'caution', shells: { powershell: 'ssh.exe ${host}' } });
		expect(cat.commands[0].params?.[0].name).toBe('host');
	});

	it('un texto simple se muestra igual en todos los idiomas', () => {
		const [cmd] = parseCustomCommands([category([deploy])]).categories[0].commands;
		expect(localize(cmd.title, 'ja')).toBe('Desplegar');
		expect(localize(cmd.title, 'en')).toBe('Desplegar');
	});

	it('un texto por idioma usa el activo, después en, después es, después el primero', () => {
		const [cmd] = parseCustomCommands([
			category([{ ...deploy, title: { es: 'Desplegar', fr: 'Déployer' } }]),
		]).categories[0].commands;
		expect(localize(cmd.title, 'fr')).toBe('Déployer');
		expect(localize(cmd.title, 'en')).toBe('Desplegar');
		expect(localize(cmd.title, 'ja')).toBe('Desplegar');
		const [onlyFr] = parseCustomCommands([category([{ ...deploy, title: { fr: 'Déployer' } }])]).categories[0].commands;
		expect(localize(onlyFr.title, 'es')).toBe('Déployer');
	});

	it('tags en lista o por idioma; los no válidos se ignoran sin omitir el comando', () => {
		const [list, byLang, bad] = parseCustomCommands([
			category([
				{ ...deploy, id: 'a', tags: ['release', 42] },
				{ ...deploy, id: 'b', tags: { en: ['release'], es: ['publicar'] } },
				{ ...deploy, id: 'c', tags: 'release' },
			]),
		]).categories[0].commands;
		expect(list.tags).toEqual({ en: ['release'], es: ['release'] });
		expect(byLang.tags).toEqual({ en: ['release'], es: ['publicar'] });
		expect(bad.tags).toEqual({ en: [], es: [] });
	});

	it('un comando inválido no afecta a los demás de su categoría', () => {
		const result = parseCustomCommands([category([deploy, { ...deploy, id: 'otro', risk: 'danger' }])]);
		expect(result.categories[0].commands.map((c) => c.id)).toEqual(['custom-mi-proyecto.deploy']);
		expect(result.problems).toEqual([
			{ where: 'customCommands[0].commands[1] (otro)', reason: 'invalidRisk', detail: 'danger' },
		]);
	});

	it.each([
		['un salto de línea', 'cd app\nrm -rf dist', 'controlChars'],
		['un separador de línea Unicode', `echo a${String.fromCharCode(0x2028)}rm -rf ~`, 'controlChars'],
		['una tabulación', 'echo\ta', 'controlChars'],
		['más de 1000 caracteres', 'a'.repeat(MAX_TEMPLATE_LENGTH + 1), 'tooLong'],
		['solo espacios', '   ', 'invalidCommand'],
	])('omite una plantilla con %s', (_name, command, reason) => {
		expect(reasons([category([deploy, { ...deploy, id: 'x', command }])])).toEqual([reason]);
	});

	it('acepta una plantilla de exactamente 1000 caracteres', () => {
		expect(reasons([category([{ ...deploy, command: 'a'.repeat(MAX_TEMPLATE_LENGTH) }])])).toEqual([]);
	});

	it('omite una variante de shell con salto de línea o con una clave desconocida', () => {
		expect(
			reasons([
				category([
					deploy,
					{ ...deploy, id: 'a', shells: { powershell: 'a\nb' } },
					{ ...deploy, id: 'b', shells: { fish: 'ls' } },
				]),
			]),
		).toEqual(['controlChars', 'invalidShell']);
	});

	it('aplica las reglas de parámetros del catálogo', () => {
		const label = { label: 'Servidor', placeholder: 'x' };
		const result = parseCustomCommands([
			category([
				deploy,
				{ ...deploy, id: 'a', command: 'ssh ${host}' },
				{ ...deploy, id: 'b', command: 'ls', params: [{ name: 'host', ...label }] },
				{ ...deploy, id: 'c', command: 'ssh ${host}', params: [{ name: 'host', ...label }, { name: 'host', ...label }] },
				{ ...deploy, id: 'd', command: 'ls', shells: { cmd: 'dir ${dir}' } },
			]),
		]);
		expect(result.problems.map((p) => [p.reason, p.detail])).toEqual([
			['undeclaredParam', 'host'],
			['unusedParam', 'host'],
			['duplicateParam', 'host'],
			['undeclaredParam', 'dir'],
		]);
	});

	it('omite parámetros con nombre inválido o sin textos', () => {
		expect(
			reasons([
				category([
					deploy,
					{ ...deploy, id: 'a', command: 'ls ${1x}', params: [{ name: '1x', label: 'a', placeholder: 'b' }] },
					{ ...deploy, id: 'b', command: 'ls ${dir}', params: [{ name: 'dir', label: '', placeholder: 'b' }] },
				]),
			]),
		).toEqual(['invalidCommand', 'invalidText']);
	});

	it.each([
		['sin id', { title: 'X', command: 'ls' }],
		['id con mayúsculas', { id: 'Deploy', title: 'X', command: 'ls' }],
		['id de 51 caracteres', { id: 'a'.repeat(51), title: 'X', command: 'ls' }],
		['sin command', { id: 'a', title: 'X' }],
	])('omite un comando %s', (_name, cmd) => {
		expect(reasons([category([deploy, cmd])])).toEqual(['invalidCommand']);
	});

	it.each([
		['sin título', { id: 'a', command: 'ls' }],
		['título vacío', { id: 'a', title: '  ', command: 'ls' }],
		['título en un idioma desconocido', { id: 'a', title: { 'fr-fr': 'X' }, command: 'ls' }],
		['título con salto de línea', { id: 'a', title: 'a\nb', command: 'ls' }],
	])('omite un comando con %s', (_name, cmd) => {
		expect(reasons([category([deploy, cmd])])).toEqual(['invalidText']);
	});

	it('omite un comando con id repetido en su categoría', () => {
		expect(commandIds([category([deploy, { ...deploy, title: 'Otra' }])])).toEqual(['custom-mi-proyecto.deploy']);
		expect(reasons([category([deploy, { ...deploy, title: 'Otra' }])])).toEqual(['duplicateCommand']);
	});

	it('el mismo id de comando en dos categorías da dos comandos distintos', () => {
		expect(commandIds([category([deploy]), { ...category([deploy]), id: 'otro' }])).toEqual([
			'custom-mi-proyecto.deploy',
			'custom-otro.deploy',
		]);
	});

	it('omite categorías inválidas, repetidas o sin comandos válidos', () => {
		const result = parseCustomCommands([
			category([deploy]),
			category([deploy]),
			{ id: 'Mal', title: 'X', commands: [deploy] },
			{ id: 'sin-comandos', title: 'X', commands: [] },
			{ id: 'sin-titulo', commands: [deploy] },
			{ id: 'invalidos', title: 'X', commands: [{ id: 'a' }] },
			'x',
		]);
		expect(result.categories.map((c) => c.id)).toEqual(['custom-mi-proyecto']);
		expect(result.problems.map((p) => [p.where, p.reason])).toEqual([
			['customCommands[1] (mi-proyecto)', 'duplicateCategory'],
			['customCommands[2]', 'invalidCategory'],
			['customCommands[3] (sin-comandos)', 'emptyCategory'],
			['customCommands[4] (sin-titulo)', 'invalidCategory'],
			['customCommands[5].commands[0] (a)', 'invalidText'],
			['customCommands[5] (invalidos)', 'emptyCategory'],
			['customCommands[6]', 'invalidCategory'],
		]);
	});

	it('un icono con formato inválido usa el de terminal', () => {
		expect(parseCustomCommands([category([deploy], { icon: 'No Vale' })]).categories[0].icon).toBe('terminal');
	});

	it('conserva el orden del ajuste', () => {
		const result = parseCustomCommands([{ ...category([deploy]), id: 'b' }, { ...category([deploy]), id: 'a' }]);
		expect(result.categories.map((c) => c.id)).toEqual(['custom-b', 'custom-a']);
	});

	it(`como máximo ${MAX_CUSTOM_CATEGORIES} categorías y ${MAX_CUSTOM_COMMANDS} comandos`, () => {
		const many = Array.from({ length: MAX_CUSTOM_CATEGORIES + 1 }, (_, i) => ({
			id: `c${i}`,
			title: `C${i}`,
			commands: Array.from({ length: 5 }, (_, j) => ({ ...deploy, id: `d${j}` })),
		}));
		const result = parseCustomCommands(many);
		expect(result.categories.flatMap((c) => c.commands)).toHaveLength(MAX_CUSTOM_COMMANDS);
		expect(result.problems.every((p) => p.reason === 'tooMany' || p.reason === 'emptyCategory')).toBe(true);
		expect(result.problems.some((p) => p.where === `customCommands[${MAX_CUSTOM_CATEGORIES}]`)).toBe(true);
	});
});
