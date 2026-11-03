import { describe, expect, it } from 'vitest';
import { CatalogService } from '../../../src/catalog/CatalogService';
import type { Command, ShellId } from '../../../src/catalog/types';
import {
	buildCommandText,
	escapeValue,
	MAX_VALUE_LENGTH,
	quoteContexts,
	validateValue,
} from '../../../src/params/escape';
import { makeCommand } from '../catalog/fixtures';

const catalog = new CatalogService();

function command(id: string): Command {
	const cmd = catalog.getCommand(id);
	if (!cmd) throw new Error(`no existe ${id}`);
	return cmd;
}

/** Texto de un comando del catálogo con un valor para cada parámetro, en orden. */
function text(id: string, shell: ShellId, ...values: string[]): string {
	const cmd = command(id);
	const names = (cmd.params ?? []).map((p) => p.name);
	return buildCommandText(cmd, shell, new Map(names.map((n, i) => [n, values[i]])));
}

const contextsOf = (template: string, shell: ShellId) => quoteContexts(template, shell).map((s) => s.context);

describe('quoteContexts', () => {
	it('suelto, entre comillas dobles y entre simples', () => {
		expect(contextsOf(`a \${x} "\${y}" '\${z}'`, 'bash')).toEqual(['bare', 'double', 'single']);
		expect(contextsOf(`a \${x} "\${y}" '\${z}'`, 'powershell')).toEqual(['bare', 'double', 'single']);
	});

	it('las comillas de un tipo son literales dentro de las del otro', () => {
		expect(contextsOf(`"it's \${x}" '"\${y}'`, 'bash')).toEqual(['double', 'single']);
	});

	it('posiciones y nombres', () => {
		expect(quoteContexts('cp ${source} ${destination}', 'bash')).toEqual([
			{ name: 'source', start: 3, end: 12, context: 'bare' },
			{ name: 'destination', start: 13, end: 27, context: 'bare' },
		]);
	});

	it("en cmd, ' fuera de comillas dobles es literal y dentro abre nestedSingle", () => {
		expect(contextsOf(`echo it's \${x}`, 'cmd')).toEqual(['bare']);
		expect(contextsOf(`a "\${x} '\${y}' \${z}" \${w}`, 'cmd')).toEqual(['double', 'nestedSingle', 'double', 'bare']);
	});
});

describe('validateValue', () => {
	it.each(['', '   '])('vacío %j', (value) => {
		expect(validateValue(value, 'bash')).toBe('empty');
	});

	it.each(['main\nrm -rf ~', 'a\rb', 'a\tb', 'a\u0085b', 'a\u2028b', 'a\u2029b', 'a\u0000b', 'a\u007fb', 'main\n'])(
		'control %j',
		(value) => {
			expect(validateValue(value, 'powershell')).toBe('control');
		},
	);

	it('longitud máxima tras recortar', () => {
		expect(validateValue('a'.repeat(MAX_VALUE_LENGTH), 'bash')).toBeUndefined();
		expect(validateValue(` ${'a'.repeat(MAX_VALUE_LENGTH)} `, 'bash')).toBeUndefined();
		expect(validateValue('a'.repeat(MAX_VALUE_LENGTH + 1), 'bash')).toBe('tooLong');
	});

	it('" y % solo se rechazan en cmd', () => {
		for (const value of ['mi "archivo".txt', '100%']) {
			expect(validateValue(value, 'cmd')).toBe('cmdUnsafe');
			for (const shell of ['bash', 'zsh'] as const) {
				expect(validateValue(value, shell)).toBeUndefined();
			}
		}
	});

	it('PowerShell rechaza " pero acepta % y las comillas tipográficas', () => {
		expect(validateValue('mi "archivo".txt', 'powershell')).toBe('powershellUnsafe');
		expect(validateValue('100%', 'powershell')).toBeUndefined();
		expect(validateValue('\u201chola\u201d', 'powershell')).toBeUndefined();
	});
});

describe('barras invertidas finales', () => {
	it.each([
		['cmd', 'bare', 'mi dir\\', '"mi dir\\\\"'],
		['cmd', 'double', '\\', '\\\\'],
		['cmd', 'double', 'x y\\\\', 'x y\\\\\\\\'],
		['cmd', 'bare', 'C:\\', 'C:\\'],
		['cmd', 'nestedSingle', 'mi dir\\', 'mi dir\\'],
		['powershell', 'bare', 'mi dir\\', `'mi dir\\\\'`],
		['powershell', 'double', 'mi dir\\', 'mi dir\\\\'],
		['powershell', 'single', 'mi dir\\', 'mi dir\\\\'],
		['powershell', 'bare', 'C:\\', 'C:\\'],
		['powershell', 'double', 'C:\\temp\\', 'C:\\temp\\'],
		['bash', 'bare', 'mi dir\\', `'mi dir\\'`],
	] as const)('%s %s: %s → %s', (shell, context, value, expected) => {
		expect(escapeValue(value, shell, context)).toBe(expected);
	});

	it('el resto de barras no cambia', () => {
		expect(escapeValue('C:\\mi dir\\a', 'cmd', 'bare')).toBe('"C:\\mi dir\\a"');
	});
});

describe('escapeValue', () => {
	it.each([
		['bash', 'feature/login'],
		['bash', 'node:20'],
		['bash', '8080:80'],
		['bash', 'user@host'],
		['bash', '-v'],
		['bash', './src/a-b.ts'],
		['zsh', 'a=b'],
		['powershell', 'feature/login'],
		['powershell', 'C:\\temp\\log.txt'],
		['powershell', '8080:80'],
		['cmd', 'C:\\temp\\log.txt'],
		['cmd', 'feature/login'],
	] as const)('%s: %s se escribe sin comillas', (shell, value) => {
		expect(escapeValue(value, shell, 'bare')).toBe(value);
	});

	it.each([
		['bash', '~/x', `'~/x'`],
		['zsh', '=x', `'=x'`],
		['bash', 'C:\\temp', `'C:\\temp'`],
		['bash', 'mis cosas', `'mis cosas'`],
		['bash', `it's`, `'it'\\''s'`],
		['bash', '$(rm -rf ~)', `'$(rm -rf ~)'`],
		['powershell', '-x', `'-x'`],
		['powershell', '@x', `'@x'`],
		['powershell', 'a,b', `'a,b'`],
		['powershell', 'mis cosas', `'mis cosas'`],
		['powershell', `it's`, `'it''s'`],
		['powershell', 'it\u2019s', `'it\u2019\u2019s'`],
		['powershell', '$(Remove-Item x)', `'$(Remove-Item x)'`],
		['cmd', 'a=b', `"a=b"`],
		['cmd', 'a,b', `"a,b"`],
		['cmd', 'mis cosas & del x', `"mis cosas & del x"`],
	] as const)('%s suelto: %s → %s', (shell, value, expected) => {
		expect(escapeValue(value, shell, 'bare')).toBe(expected);
	});

	it.each([
		['bash', 'a "b" $HOME `id` \\n', 'a \\"b\\" \\$HOME \\`id\\` \\\\n'],
		['zsh', 'hola!', `hola"'!'"`],
		['bash', `it's`, `it's`],
		['powershell', 'usa $env:PATH', 'usa `$env:PATH'],
		['powershell', 'a "b" `c`', 'a `"b`" ``c``'],
		['powershell', '\u201chola\u201d', '`\u201chola`\u201d'],
		['powershell', `it's`, `it's`],
		['cmd', `it's & <x>`, `it's & <x>`],
	] as const)('%s entre comillas dobles: %s → %s', (shell, value, expected) => {
		expect(escapeValue(value, shell, 'double')).toBe(expected);
	});

	it.each([
		['bash', `it's $x`, `it'\\''s $x`],
		['powershell', `it's $x`, `it''s $x`],
		['powershell', 'it\u2018s', 'it\u2018\u2018s'],
	] as const)('%s entre comillas simples: %s → %s', (shell, value, expected) => {
		expect(escapeValue(value, shell, 'single')).toBe(expected);
	});

	it('cmd con PowerShell incrustado duplica las comillas simples', () => {
		expect(escapeValue(`it's log.txt`, 'cmd', 'nestedSingle')).toBe(`it''s log.txt`);
	});
});

describe('buildCommandText (escenarios de la spec)', () => {
	it('valor seguro en bash', () => {
		expect(text('git.new-branch', 'bash', 'feature/login')).toBe('git checkout -b feature/login');
	});

	it('valor con espacios en bash, PowerShell y cmd', () => {
		expect(text('terminal.remove-directory', 'bash', 'mis cosas')).toBe(`rm -rf 'mis cosas'`);
		expect(text('terminal.remove-directory', 'powershell', 'mis cosas')).toBe(`Remove-Item -Recurse -Force 'mis cosas'`);
		expect(text('terminal.remove-directory', 'cmd', 'mis cosas')).toBe(`rmdir /s /q "mis cosas"`);
	});

	it('comilla simple en bash y PowerShell', () => {
		expect(text('terminal.show-file', 'bash', `it's.txt`)).toBe(`cat 'it'\\''s.txt'`);
		expect(text('terminal.show-file', 'powershell', `it's.txt`)).toBe(`Get-Content 'it''s.txt'`);
	});

	it('ruta de Windows en PowerShell', () => {
		expect(text('terminal.show-file', 'powershell', 'C:\\temp\\log.txt')).toBe('Get-Content C:\\temp\\log.txt');
	});

	it('mensaje de commit entre comillas dobles', () => {
		expect(text('git.commit', 'bash', 'fix: usa $HOME y "comillas"!')).toBe(
			`git commit -m "fix: usa \\$HOME y \\"comillas\\""'!'""`,
		);
		expect(text('git.commit', 'powershell', 'usa $env:PATH')).toBe('git commit -m "usa `$env:PATH"');
	});

	it('seguir un archivo en cmd', () => {
		expect(text('terminal.follow-file', 'cmd', `it's log.txt`)).toBe(
			`powershell -NoProfile -Command "Get-Content -LiteralPath 'it''s log.txt' -Tail 50 -Wait"`,
		);
	});

	it('patrón con comodín entre comillas', () => {
		expect(text('terminal.find-files', 'bash', '*.ts')).toBe('find . -name "*.ts"');
	});

	it('Git Bash y PowerShell con un valor seguro', () => {
		expect(text('terminal.remove-directory', 'bash', 'tmp')).toBe('rm -rf tmp');
		expect(text('terminal.remove-directory', 'powershell', 'tmp')).toBe('Remove-Item -Recurse -Force tmp');
	});

	it('un parámetro que aparece dos veces se escapa según cada contexto', () => {
		const cmd = makeCommand({ id: 'test.x', command: 'echo ${x} "${x}"', params: [paramX] });
		expect(buildCommandText(cmd, 'bash', new Map([['x', 'a b$']]))).toBe(`echo 'a b$' "a b\\$"`);
	});

	it('sin parámetros devuelve la plantilla', () => {
		expect(buildCommandText(command('git.status'), 'bash', new Map())).toBe('git status');
	});

	it('falta un valor: error de programación', () => {
		expect(() => buildCommandText(command('git.new-branch'), 'bash', new Map())).toThrow(/branch/);
	});
});

const paramX = { name: 'x', label: { en: 'X', es: 'X' }, placeholder: { en: 'x', es: 'x' } };
