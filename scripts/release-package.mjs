// Empaquetado local de la extensión: `pnpm run release:package`. Genera el .vsix con vsce
// (que ejecuta antes vscode:prepublish, el build de producción) y comprueba su contenido y su
// tamaño. Sin dependencias propias: funciona igual en Windows (cmd/PowerShell) y en Linux/WSL.
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { catalogPackageFiles, checkSize, disallowedFiles, formatBytes, isPreRelease, missingFiles, vsixName } from './release-check.mjs';

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

/** Lista los archivos que entrarían en el paquete y falla si alguno no está permitido o falta uno de `required`. */
function checkFiles(when, required) {
	const files = vsce(['ls', '--no-dependencies'], { capture: true })
		.split(/\r?\n/)
		.filter((line) => line.trim().length > 0);
	const extra = disallowedFiles(files);
	if (extra.length > 0) {
		fail(`contenido del paquete (${when}): archivos no permitidos:\n  ${extra.join('\n  ')}`);
	}
	const missing = missingFiles(files, required);
	if (missing.length > 0) {
		fail(`contenido del paquete (${when}): faltan archivos obligatorios:\n  ${missing.join('\n  ')}`);
	}
	return files;
}

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const name = vsixName(pkg);
/** Obligatorios en el paquete: el icono de la tienda y los avisos de terceros (D4 de marketplace-release). */
const required = [pkg.icon ?? 'media/icon.png', 'ThirdPartyNotices.txt'];
const preRelease = isPreRelease(pkg.version);

console.log('▶ contenido (antes del build)');
checkFiles('antes del build', required);

console.log(`\n▶ vsce package → ${name}${preRelease ? ' (pre-release)' : ''}`);
// Pre-release solo mientras la versión sea 0.x (D4 de marketplace-release).
vsce(['package', '--no-dependencies', ...(preRelease ? ['--pre-release'] : []), '--out', name]);

console.log('\n▶ contenido (con el build)');
// Con el build, también cada categoría del catálogo en dist/catalog/ (D1 de catalog-sections).
const files = checkFiles('con el build', [...required, ...catalogPackageFiles(readdirSync(resolve(root, 'catalog')))]);

const path = resolve(root, name);
const bytes = statSync(path).size;
const sizeError = checkSize(bytes);
if (sizeError) {
	fail(`tamaño: ${sizeError}`);
}

console.log(`\n✔ ${name} · ${preRelease ? 'pre-release' : 'estable'} · ${formatBytes(bytes)} · ${files.length} archivos`);
console.log(`  ${path}`);
