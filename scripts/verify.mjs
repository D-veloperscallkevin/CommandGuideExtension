// Verificación completa del proyecto. La ejecuta el hook pre-push (.githooks/pre-push)
// y se puede lanzar a mano con `pnpm run verify`. Sin dependencias: funciona igual en
// Windows (cmd/PowerShell) y en Linux/WSL.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const steps = ['check-types', 'lint', 'lint:webview', 'test:unit', 'package', 'test'];

const expected = readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8').trim().replace(/^v/, '').split('.')[0];
const found = process.versions.node.split('.')[0];
if (expected !== found) {
	console.error(`✖ verify falló en: node (Node ${expected} esperado según .nvmrc, encontrado ${found})`);
	process.exit(1);
}

for (const step of steps) {
	console.log(`\n▶ ${step}`);
	const { status } = spawnSync('pnpm', ['run', step], { stdio: 'inherit', shell: true });
	if (status !== 0) {
		console.error(`\n✖ verify falló en: ${step}`);
		process.exit(status ?? 1);
	}
}

console.log('\n✔ verify OK');
