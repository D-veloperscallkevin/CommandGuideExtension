// Empaquetado local de la extensión: `pnpm run release:package`. Genera el .vsix con vsce
// (que ejecuta antes vscode:prepublish, el build de producción) y comprueba su contenido y su
// tamaño. Sin dependencias propias: funciona igual en Windows (cmd/PowerShell) y en Linux/WSL.
import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkSize, disallowedFiles, formatBytes, vsixName } from './release-check.mjs';

const root = resolve(import.meta.dirname, '..');

/** Termina con el motivo y código 1. */
function fail(reason) {
	console.error(`\n✖ release:package falló en: ${reason}`);
	process.exit(1);
}

/** Ejecuta vsce (la versión fijada en el proyecto) y devuelve su salida o termina. */
function vsce(args, { capture = false } = {}) {
	// Una sola cadena con shell: los argumentos son fijos (sin entrada del usuario) y así no
	// hay aviso DEP0190 de Node por pasar argumentos sueltos con `shell: true`.
	const result = spawnSync(['pnpm', 'exec', 'vsce', ...args].join(' '), {
		cwd: root,
		shell: true,
		encoding: 'utf8',
		stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
	});
	if (result.status !== 0) {
		fail(`vsce ${args[0]} (código ${result.status ?? 'desconocido'})`);
	}
	return result.stdout ?? '';
}

/** Lista los archivos que entrarían en el paquete y falla si alguno no está permitido. */
function checkFiles(when) {
	const files = vsce(['ls', '--no-dependencies'], { capture: true })
		.split(/\r?\n/)
		.filter((line) => line.trim().length > 0);
	const extra = disallowedFiles(files);
	if (extra.length > 0) {
		fail(`contenido del paquete (${when}): archivos no permitidos:\n  ${extra.join('\n  ')}`);
	}
	return files;
}

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const name = vsixName(pkg);

console.log('▶ contenido (antes del build)');
checkFiles('antes del build');

console.log(`\n▶ vsce package → ${name}`);
// Pre-release mientras la versión sea 0.x (design D4 de release-pipeline).
vsce(['package', '--no-dependencies', '--pre-release', '--out', name]);

console.log('\n▶ contenido (con el build)');
const files = checkFiles('con el build');

const path = resolve(root, name);
const bytes = statSync(path).size;
const sizeError = checkSize(bytes);
if (sizeError) {
	fail(`tamaño: ${sizeError}`);
}

console.log(`\n✔ ${name} · ${formatBytes(bytes)} · ${files.length} archivos`);
console.log(`  ${path}`);
