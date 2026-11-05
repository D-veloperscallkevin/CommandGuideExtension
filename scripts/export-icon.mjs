// Exporta media/logo.svg a media/icon.png (128×128, fondo transparente) con Chrome headless.
// Se ejecuta a mano solo cuando cambia el logo (`node scripts/export-icon.mjs`); el PNG se versiona.
// No forma parte de `verify`. Sin dependencias: usa el Chrome instalado (o CHROME_PATH).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SIZE = 128;
const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'media/logo.svg');
const target = resolve(root, 'media/icon.png');

const candidates = [
	process.env.CHROME_PATH,
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	'/usr/bin/google-chrome',
	'/usr/bin/chromium',
	'/usr/bin/chromium-browser',
].filter(Boolean);
const chrome = candidates.find((path) => existsSync(path));
if (!chrome) {
	console.error('✖ No se encontró Chrome. Indica su ruta en la variable CHROME_PATH.');
	process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), 'devcommands-icon-'));
try {
	const html = join(dir, 'icon.html');
	const svg = readFileSync(source, 'utf8');
	writeFileSync(
		html,
		`<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block;width:${SIZE}px;height:${SIZE}px}</style></head><body>${svg}</body></html>`,
	);
	const result = spawnSync(
		chrome,
		[
			'--headless=new',
			'--disable-gpu',
			'--hide-scrollbars',
			'--force-device-scale-factor=1',
			`--window-size=${SIZE},${SIZE}`,
			'--default-background-color=00000000',
			`--user-data-dir=${join(dir, 'profile')}`,
			`--screenshot=${target}`,
			pathToFileURL(html).href,
		],
		{ encoding: 'utf8' },
	);
	if (result.status !== 0 || !existsSync(target)) {
		console.error(`✖ Chrome falló (código ${result.status ?? 'desconocido'}).\n${result.stderr ?? ''}`);
		process.exit(1);
	}
	const png = readFileSync(target);
	console.log(`✔ media/icon.png · ${png.readUInt32BE(16)}×${png.readUInt32BE(20)} · ${png.length} bytes`);
} finally {
	rmSync(dir, { recursive: true, force: true });
}
