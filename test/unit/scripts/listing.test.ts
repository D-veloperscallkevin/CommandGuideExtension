// Ficha de las tiendas (marketplace-release, D7): manifiesto, icono, licencia, avisos y README.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as Record<string, unknown>;
const readme = readFileSync(resolve('README.md'), 'utf8');

describe('manifiesto de tienda', () => {
	it('nombre visible nuevo sin cambiar el id', () => {
		expect(pkg.displayName).toBe('DevCommands Guide');
		expect(`${pkg.publisher as string}.${pkg.name as string}`).toBe('aguilardigital.devcommands');
	});

	it('licencia propietaria en el archivo LICENSE', () => {
		expect(pkg.license).toBe('SEE LICENSE IN LICENSE');
		const license = readFileSync(resolve('LICENSE'), 'utf8');
		expect(license).toContain('All rights reserved.');
		expect(license).not.toMatch(/^MIT License/);
		expect(license).toContain('ThirdPartyNotices.txt');
	});

	it('categorías, palabras clave, precio, banner y enlaces', () => {
		expect(pkg.categories).toEqual(['Other', 'Education']);
		expect(pkg.keywords).toEqual(expect.arrayContaining(['git', 'npm', 'pnpm', 'node', 'docker', 'terminal']));
		expect(pkg.pricing).toBe('Free');
		expect(pkg.galleryBanner).toEqual({ color: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/), theme: 'dark' });
		expect(pkg.homepage).toMatch(/^https:\/\/github\.com\//);
		expect((pkg.bugs as { url: string }).url).toMatch(/^https:\/\/github\.com\/.+\/issues$/);
	});

	it('el icono de la tienda es un PNG de 128×128 con transparencia', () => {
		expect(pkg.icon).toBe('media/icon.png');
		const png = readFileSync(resolve(pkg.icon as string));
		expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
		expect(png.toString('ascii', 12, 16)).toBe('IHDR');
		expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([128, 128]);
		// Tipo de color 6: RGBA.
		expect(png[25]).toBe(6);
	});

	it('la barra de actividad usa un SVG monocromo, sin colores propios', () => {
		const contributes = pkg.contributes as { viewsContainers: { activitybar: { icon: string }[] } };
		const icon = contributes.viewsContainers.activitybar[0].icon;
		expect(icon).toBe('media/icon.svg');
		const svg = readFileSync(resolve(icon), 'utf8');
		const colors = [...svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]);
		expect(colors.length).toBeGreaterThan(0);
		expect(colors.filter((c) => c !== 'currentColor' && c !== 'none')).toEqual([]);
		expect(svg).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|<style/i);
	});
});

describe('patrocinio', () => {
	it('enlace de patrocinio en el manifiesto (botón Sponsor de la ficha)', () => {
		expect(pkg.sponsor).toEqual({ url: 'https://github.com/sponsors/D-veloperscallkevin' });
	});
});

describe('avisos de terceros', () => {
	const notices = readFileSync(resolve('ThirdPartyNotices.txt'), 'utf8');

	it.each(['React', 'react-dom', 'scheduler', '@vscode/codicons'])('incluye %s', (name) => {
		expect(notices).toMatch(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')} \\d`, 'm'));
	});

	it('incluye los textos MIT y CC BY 4.0', () => {
		expect(notices).toContain('Copyright (c) Meta Platforms, Inc. and affiliates.');
		expect(notices).toContain('Copyright (c) Microsoft Corporation.');
		expect(notices).toContain('Attribution 4.0 International');
	});
});

describe('README de la tienda', () => {
	const images = [...readme.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g), ...readme.matchAll(/<img[^>]+src="([^"]+)"/g)].map(
		(m) => m[1],
	);

	it('no se presenta como trabajo en curso', () => {
		expect(readme).not.toMatch(/work in progress/i);
		expect(readme).not.toMatch(/pre-release\)/i);
	});

	it('enlaza las 5 capturas como PNG relativos de docs/images', () => {
		for (const name of ['panel', 'search', 'params', 'destructive', 'quick-pick']) {
			expect(images).toContain(`docs/images/${name}.png`);
		}
		for (const src of images) {
			expect(src).toMatch(/^docs\/images\/[a-z0-9-]+\.png$/);
		}
	});

	it('no contiene imágenes SVG', () => {
		expect(images.filter((src) => /\.svg($|\?)/i.test(src))).toEqual([]);
	});

	it('lleva un enlace de texto a GitHub Sponsors junto al título', () => {
		expect(readme.split(/\r?\n/)[0].trim()).toBe('# DevCommands Guide · [♥ Sponsor](https://github.com/sponsors/D-veloperscallkevin)');
	});

	it('tiene la sección Support con el enlace a GitHub Sponsors, antes de License', () => {
		const support = readme.indexOf('## Support');
		expect(support).toBeGreaterThan(-1);
		expect(support).toBeLessThan(readme.indexOf('## License'));
		expect(readme.slice(support, readme.indexOf('## License'))).toContain('(https://github.com/sponsors/D-veloperscallkevin)');
	});

	it('describe la licencia y enlaza los avisos de terceros', () => {
		const license = readme.slice(readme.indexOf('## License'));
		expect(license).toContain('(LICENSE)');
		expect(license).toContain('(ThirdPartyNotices.txt)');
		expect(existsSync(resolve('ThirdPartyNotices.txt'))).toBe(true);
	});
});
