import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/src/test/**/*.test.js',
	// Carpeta abierta en los tests: un proyecto mínimo con package.json y pnpm-lock.yaml.
	workspaceFolder: 'test/fixtures/workspace',
});
