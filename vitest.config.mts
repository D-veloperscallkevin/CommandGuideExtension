import { defineConfig } from 'vitest/config';

// Tests unitarios de lógica pura (sin VS Code). Los de integración siguen en
// src/test con Mocha + @vscode/test-cli.
export default defineConfig({
	test: {
		environment: 'node',
		include: ['test/unit/**/*.test.ts'],
	},
});
