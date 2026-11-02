// Lo ejecuta `npm install` / `npm ci` (script prepare): activa los hooks versionados
// en .githooks. Fuera de un repositorio git no hace nada.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const root = new URL('..', import.meta.url);

if (existsSync(new URL('.git', root))) {
	spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: root, stdio: 'inherit' });
}
