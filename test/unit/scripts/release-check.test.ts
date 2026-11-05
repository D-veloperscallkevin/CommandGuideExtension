import { describe, expect, it } from 'vitest';
import {
	checkSize,
	disallowedFiles,
	formatBytes,
	isPreRelease,
	MAX_VSIX_BYTES,
	missingFiles,
	vsixName,
} from '../../../scripts/release-check.mjs';

describe('checkSize', () => {
	it('acepta un paquete justo por debajo del límite', () => {
		expect(checkSize(MAX_VSIX_BYTES - 1)).toBeNull();
		expect(checkSize(300 * 1024)).toBeNull();
	});

	it('rechaza 2 MB exactos o más, indicando ambos tamaños', () => {
		expect(checkSize(MAX_VSIX_BYTES)).toBe('el .vsix pesa 2.0 MB y el límite es menos de 2.0 MB');
		expect(checkSize(3 * 1024 * 1024)).toContain('3.0 MB');
	});
});

describe('disallowedFiles', () => {
	it('permite el código compilado, los recursos, las traducciones y los documentos', () => {
		expect(
			disallowedFiles([
				'dist/extension.js',
				'dist/webview/index.html',
				'dist/webview/assets/index.js',
				'media/icon.svg',
				'l10n/bundle.l10n.es.json',
				'package.json',
				'package.nls.json',
				'package.nls.ja.json',
				'package.nls.pt-br.json',
				'README.md',
				'CHANGELOG.md',
				'LICENSE',
				'ThirdPartyNotices.txt',
				'media/icon.png',
			]),
		).toEqual([]);
	});

	it('rechaza mapas, fuentes, dependencias, el catálogo crudo, paquetes anteriores y capturas', () => {
		expect(
			disallowedFiles([
				'dist/extension.js',
				'dist/extension.js.map',
				'src/extension.ts',
				'node_modules/x/index.js',
				'catalog/git.json',
				'devcommands-0.0.1.vsix',
				'package.nls.fr-fr-x.json',
				'docs/images/panel.png',
			]),
		).toEqual([
			'dist/extension.js.map',
			'src/extension.ts',
			'node_modules/x/index.js',
			'catalog/git.json',
			'devcommands-0.0.1.vsix',
			'package.nls.fr-fr-x.json',
			'docs/images/panel.png',
		]);
	});

	it('normaliza las rutas de Windows y ignora líneas vacías', () => {
		expect(disallowedFiles(['dist\\webview\\assets\\index.js', ' ', 'src\\a.ts', './README.md'])).toEqual([
			'src/a.ts',
		]);
	});
});

describe('formatBytes y vsixName', () => {
	it('muestra KB por debajo de 1 MB y MB con un decimal a partir de ahí', () => {
		expect(formatBytes(310_000)).toBe('303 KB');
		expect(formatBytes(1.4 * 1024 * 1024)).toBe('1.4 MB');
	});

	it('nombra el paquete con el nombre y la versión', () => {
		expect(vsixName({ name: 'devcommands', version: '0.1.0' })).toBe('devcommands-0.1.0.vsix');
	});
});

describe('isPreRelease', () => {
	it('marca como pre-release las versiones 0.x', () => {
		expect(isPreRelease('0.1.0')).toBe(true);
		expect(isPreRelease('0.9.9')).toBe(true);
	});

	it('empaqueta como estable a partir de 1.0.0', () => {
		expect(isPreRelease('1.0.0')).toBe(false);
		expect(isPreRelease('2.3.4')).toBe(false);
		expect(isPreRelease('10.0.0')).toBe(false);
	});
});

describe('missingFiles', () => {
	const required = ['media/icon.png', 'ThirdPartyNotices.txt'];

	it('no falta nada cuando están el icono y los avisos', () => {
		expect(missingFiles(['package.json', 'media/icon.png', 'ThirdPartyNotices.txt'], required)).toEqual([]);
	});

	it('nombra cada obligatorio que falta, en su orden', () => {
		expect(missingFiles(['package.json'], required)).toEqual(['media/icon.png', 'ThirdPartyNotices.txt']);
		expect(missingFiles(['media/icon.png'], required)).toEqual(['ThirdPartyNotices.txt']);
	});

	it('normaliza las rutas de Windows y el prefijo ./', () => {
		expect(
			missingFiles(['media\\icon.png', ' ./ThirdPartyNotices.txt'], ['./media/icon.png', 'ThirdPartyNotices.txt']),
		).toEqual([]);
	});
});
