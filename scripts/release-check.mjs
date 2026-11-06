// Comprobaciones puras del paquete .vsix (sin E/S). Las usa scripts/release-package.mjs
// y las prueban los tests unitarios (test/unit/scripts/release-check.test.ts).

/** Tamaño máximo del .vsix: debe ser estrictamente menor (2 MB). */
export const MAX_VSIX_BYTES = 2 * 1024 * 1024;

/**
 * @param {number} bytes
 * @returns {string} Tamaño legible, como "312 KB" o "1.4 MB".
 */
export function formatBytes(bytes) {
	if (bytes < 1024 * 1024) {
		return `${Math.round(bytes / 1024)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * @param {number} bytes Tamaño del .vsix.
 * @returns {string | null} `null` si cabe; si no, el motivo con ambos tamaños.
 */
export function checkSize(bytes) {
	if (bytes < MAX_VSIX_BYTES) {
		return null;
	}
	return `el .vsix pesa ${formatBytes(bytes)} y el límite es menos de ${formatBytes(MAX_VSIX_BYTES)}`;
}

const ROOT_FILES = new Set([
	'package.json',
	'README.md',
	'CHANGELOG.md',
	'LICENSE',
	'LICENSE.md',
	'LICENSE.txt',
	'ThirdPartyNotices.txt',
]);

/** @param {string} path Ruta relativa con `/`. */
function isAllowed(path) {
	if (ROOT_FILES.has(path) || /^package\.nls(\.[a-z]{2}(-[a-z]{2})?)?\.json$/.test(path)) {
		return true;
	}
	if (path.startsWith('dist/')) {
		return !path.endsWith('.map');
	}
	return path.startsWith('media/') || path.startsWith('l10n/');
}

/** @param {string} path */
const normalize = (path) => path.trim().replaceAll('\\', '/').replace(/^\.\//, '');

/**
 * Archivos obligatorios que faltan en el paquete (D4 de marketplace-release).
 * @param {readonly string[]} paths Rutas del paquete, con `/` o `\`.
 * @param {readonly string[]} required Rutas obligatorias, con `/`.
 * @returns {string[]} Las obligatorias que no están, en su orden.
 */
export function missingFiles(paths, required) {
	const present = new Set(paths.map(normalize));
	return required.map(normalize).filter((p) => !present.has(p));
}

/**
 * Rutas que el catálogo ocupa en el paquete: cada `catalog/*.json` (salvo `schema.json`) se copia a
 * `dist/catalog/` en el build (D1 de catalog-sections).
 * @param {readonly string[]} files Nombres de archivo de `catalog/`.
 * @returns {string[]} Rutas `dist/catalog/<archivo>`, en orden alfabético.
 */
export function catalogPackageFiles(files) {
	return files
		.filter((f) => f.endsWith('.json') && f !== 'schema.json')
		.sort()
		.map((f) => `dist/catalog/${f}`);
}

/**
 * Pre-release solo mientras la versión mayor sea 0 (D4 de marketplace-release).
 * @param {string} version Versión semver del manifiesto.
 */
export function isPreRelease(version) {
	return /^0\./.test(version.trim());
}

/**
 * Archivos del paquete que no están permitidos (D2 de release-pipeline).
 * @param {readonly string[]} paths Rutas relativas a la raíz, con `/` o `\`.
 * @returns {string[]} Las rutas no permitidas, normalizadas a `/`.
 */
export function disallowedFiles(paths) {
	return paths
		.map(normalize)
		.filter((p) => p.length > 0 && !isAllowed(p));
}

/**
 * @param {{ name: string, version: string }} pkg Campos de package.json.
 * @returns {string} Nombre del .vsix, como "devcommands-0.1.0.vsix".
 */
export function vsixName(pkg) {
	return `${pkg.name}-${pkg.version}.vsix`;
}
