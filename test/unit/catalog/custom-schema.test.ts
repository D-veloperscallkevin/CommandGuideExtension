import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCustomCommands } from '../../../src/catalog/custom';

// El esquema con el que VS Code valida el ajuste al escribirlo y la validación de la extensión
// deben coincidir: lo que uno acepta, el otro también.
const manifest = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const schema = manifest.contributes.configuration.properties['devcommands.customCommands'];
// strict: false, porque el esquema lleva claves propias de VS Code (markdownDescription, defaultSnippets, scope).
const validate = new Ajv({ strict: false }).compile(schema);

/** Si la extensión lo acepta entero: todo lo declarado se carga, sin problemas. */
const acceptedByExtension = (value: unknown) => parseCustomCommands(value).problems.length === 0;

const deploy = { id: 'deploy', title: 'Desplegar', command: 'pnpm run deploy' };
const category = (commands: unknown[], extra: Record<string, unknown> = {}) => [
	{ id: 'mi-proyecto', title: 'Mi proyecto', commands, ...extra },
];
const sep = String.fromCharCode(0x2028);

const valid: Array<[string, unknown]> = [
	['vacío', []],
	['categoría mínima', category([deploy])],
	['con icono', category([deploy], { icon: 'rocket' })],
	[
		'comando completo',
		category([
			{
				id: 'ssh',
				title: { en: 'Connect', es: 'Conectar' },
				description: 'Abre una sesión SSH',
				command: 'ssh ${host}',
				params: [{ name: 'host', label: 'Servidor', placeholder: { en: 'my-server', ja: 'サーバー' } }],
				risk: 'destructive',
				shells: { powershell: 'ssh.exe ${host}', cmd: 'ssh ${host}' },
				tags: { en: ['remote'], es: ['remoto'] },
			},
		]),
	],
	['tags en lista', category([{ ...deploy, tags: ['release'] }])],
	['plantilla de 1000 caracteres', category([{ ...deploy, command: 'a'.repeat(1000) }])],
];

const invalid: Array<[string, unknown]> = [
	['no es una lista', { id: 'x' }],
	['categoría sin comandos', category([])],
	['id de categoría con mayúsculas', [{ id: 'Mi', title: 'X', commands: [deploy] }]],
	['comando sin command', category([{ id: 'a', title: 'X' }])],
	['comando sin título', category([{ id: 'a', command: 'ls' }])],
	['título vacío', category([{ ...deploy, title: '   ' }])],
	['título con salto de línea', category([{ ...deploy, title: 'a\nb' }])],
	['título en un idioma desconocido', category([{ ...deploy, title: { 'fr-fr': 'X' } }])],
	['título como objeto vacío', category([{ ...deploy, title: {} }])],
	['riesgo no válido', category([{ ...deploy, risk: 'danger' }])],
	['salto de línea en command', category([{ ...deploy, command: 'cd app\nrm -rf dist' }])],
	['separador de línea Unicode en command', category([{ ...deploy, command: `echo a${sep}b` }])],
	['command con solo espacios', category([{ ...deploy, command: '   ' }])],
	['plantilla de 1001 caracteres', category([{ ...deploy, command: 'a'.repeat(1001) }])],
	['shell desconocido', category([{ ...deploy, shells: { fish: 'ls' } }])],
	['salto de línea en una variante', category([{ ...deploy, shells: { cmd: 'a\nb' } }])],
	['parámetro con nombre inválido', category([{ ...deploy, command: 'ls ${1x}', params: [{ name: '1x', label: 'a', placeholder: 'b' }] }])],
	['parámetro sin etiqueta', category([{ ...deploy, command: 'ls ${dir}', params: [{ name: 'dir', placeholder: 'b' }] }])],
	['id de comando de 51 caracteres', category([{ ...deploy, id: 'a'.repeat(51) }])],
];

describe('esquema del ajuste devcommands.customCommands', () => {
	it.each(valid)('el esquema y la extensión aceptan: %s', (_name, value) => {
		expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
		expect(acceptedByExtension(value)).toBe(true);
	});

	it.each(invalid)('el esquema y la extensión rechazan: %s', (_name, value) => {
		expect(validate(value)).toBe(false);
		expect(acceptedByExtension(value)).toBe(false);
	});

	it('solo se puede definir en la configuración de usuario', () => {
		expect(schema.scope).toBe('application');
	});
});
