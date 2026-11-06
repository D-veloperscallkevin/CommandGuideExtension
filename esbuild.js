const esbuild = require("esbuild");
const fs = require('node:fs');
const path = require('node:path');

/**
 * El catálogo no va en el bundle: se copia a dist/catalog/ y la extensión lo lee en el primer
 * uso. Se vacía antes, para que una categoría borrada no quede en el paquete.
 */
function copyCatalog() {
	const from = path.join(__dirname, 'catalog');
	const to = path.join(__dirname, 'dist', 'catalog');
	fs.rmSync(to, { recursive: true, force: true });
	fs.mkdirSync(to, { recursive: true });
	for (const file of fs.readdirSync(from)) {
		if (file.endsWith('.json') && file !== 'schema.json') {
			fs.copyFileSync(path.join(from, file), path.join(to, file));
		}
	}
}

/**
 * `virtual:project-signals`: los `detect` de cada categoría del catálogo, para que la detección
 * del proyecto funcione al activar sin leer dist/catalog/ (D2 de project-signals). Declara los
 * JSON en `watchFiles`, así el modo watch lo regenera al editar uno.
 * @type {import('esbuild').Plugin}
 */
const projectSignalsPlugin = {
	name: 'project-signals',
	setup(build) {
		build.onResolve({ filter: /^virtual:project-signals$/ }, (args) => ({ path: args.path, namespace: 'project-signals' }));
		build.onLoad({ filter: /.*/, namespace: 'project-signals' }, () => {
			const dir = path.join(__dirname, 'catalog');
			const files = fs
				.readdirSync(dir)
				.filter((file) => file.endsWith('.json') && file !== 'schema.json')
				.sort()
				.map((file) => path.join(dir, file));
			const entries = files
				.map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))
				.filter((category) => Array.isArray(category.detect))
				.map((category) => ({ id: category.id, detect: category.detect }))
				.sort((a, b) => a.id.localeCompare(b.id));
			return { contents: `export default ${JSON.stringify(entries)};`, loader: 'js', watchFiles: files, watchDirs: [dir] };
		});
	},
};

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			copyCatalog();
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			projectSignalsPlugin,
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});
	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
