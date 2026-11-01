import Ajv from 'ajv';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REQUIRED_CATALOG_LOCALES, SUPPORTED_LOCALES } from '../../../src/i18n/locales';

const catalogDir = resolve('catalog');
const invalidDir = resolve('test/unit/fixtures/invalid-schema');

const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(readJson(join(catalogDir, 'schema.json')) as object);

/** Valida un archivo y devuelve los errores como "archivo instancePath mensaje". */
function schemaErrors(file: string): string[] {
	if (validate(readJson(file))) {
		return [];
	}
	return (validate.errors ?? []).map((e) => `${file} ${e.instancePath || '/'} ${e.message ?? ''}`);
}

const categoryFiles = readdirSync(catalogDir).filter((f) => f.endsWith('.json') && f !== 'schema.json');

describe('catalog/schema.json', () => {
	it('hay al menos una categoría en catalog/', () => {
		expect(categoryFiles.length).toBeGreaterThan(0);
	});

	it.each(categoryFiles)('%s valida contra el schema', (file) => {
		expect(schemaErrors(join(catalogDir, file))).toEqual([]);
	});

	const invalid: Array<[string, string]> = [
		['missing-risk.json', '/commands/0'],
		['unknown-property.json', '/commands/0'],
		['title-without-en.json', '/commands/0/title'],
		['invalid-risk.json', '/commands/0/risk'],
		['unsupported-shell.json', '/commands/0/shells'],
		['unknown-locale-key.json', '/commands/0/title'],
	];

	it.each(invalid)('rechaza %s señalando %s', (file, instancePath) => {
		const errors = schemaErrors(join(invalidDir, file));
		expect(errors.length).toBeGreaterThan(0);
		expect(errors.some((e) => e.includes(file) && e.includes(` ${instancePath} `))).toBe(true);
	});

	it('todos los fixtures inválidos están cubiertos por un caso', () => {
		expect(readdirSync(invalidDir).sort()).toEqual(invalid.map(([f]) => f).sort());
	});

	it('acepta un idioma opcional además de en y es', () => {
		const category = {
			version: 1,
			id: 'demo',
			title: { en: 'Demo', es: 'Demo' },
			icon: 'beaker',
			order: 1,
			commands: [
				{
					id: 'demo.hello',
					title: { en: 'Hello', es: 'Hola', fr: 'Bonjour' },
					description: { en: 'Says hello', es: 'Saluda', ja: 'あいさつ' },
					command: 'echo hello',
					tags: { en: ['hello'], es: ['hola'], 'zh-tw': ['你好'] },
					risk: 'safe',
				},
			],
		};
		expect(validate(category), JSON.stringify(validate.errors)).toBe(true);
	});
});

describe('idiomas del schema', () => {
	const definitions = (readJson(join(catalogDir, 'schema.json')) as {
		definitions: Record<string, { required: string[]; properties: Record<string, unknown> }>;
	}).definitions;

	it.each(['LocalizedString', 'LocalizedTags'])('%s declara exactamente SUPPORTED_LOCALES', (name) => {
		expect(Object.keys(definitions[name].properties).sort()).toEqual([...SUPPORTED_LOCALES].sort());
		expect(definitions[name].required).toEqual([...REQUIRED_CATALOG_LOCALES]);
	});
});
