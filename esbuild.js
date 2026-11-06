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
