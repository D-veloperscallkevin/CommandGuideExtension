import * as assert from 'assert';
import * as vscode from 'vscode';
import type { DevCommandsApi } from '../extension';

// <publisher>.<name> de package.json.
const extensionId = 'aguilardigital.devcommands';

/** Espera al siguiente evento y devuelve su valor, o falla tras `ms` milisegundos. */
function nextEvent<T>(event: vscode.Event<T>, ms: number): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			listener.dispose();
			reject(new Error(`sin evento tras ${ms} ms`));
		}, ms);
		const listener = event((value) => {
			clearTimeout(timer);
			listener.dispose();
			resolve(value);
		});
	});
}

suite('Vista lateral', () => {
	test('al abrir la vista, la extensión se activa, completa el handshake y envía el catálogo', async function () {
		this.timeout(20_000);
		const extension = vscode.extensions.getExtension<DevCommandsApi>(extensionId);
		assert.ok(extension, `no se encuentra la extensión ${extensionId}`);
		assert.strictEqual(extension.isActive, false, 'no debe activarse antes de abrir la vista');

		await vscode.commands.executeCommand('workbench.view.extension.devcommands');
		const api = await extension.activate();
		const categories = await nextEvent(api.onDidSendCatalog, 10_000);

		assert.strictEqual(extension.isActive, true);
		assert.deepStrictEqual(
			categories.map((c) => c.id),
			['git', 'npm', 'pnpm', 'node', 'docker', 'terminal'],
		);
		const git = categories.find((c) => c.id === 'git');
		assert.ok(git, 'el catálogo enviado no incluye git');
		assert.strictEqual(git.icon, 'git-branch');
		const gitIds = git.commands.map((c) => c.id);
		for (const id of ['git.status', 'git.new-branch', 'git.reset-hard']) {
			assert.ok(gitIds.includes(id), `git no incluye ${id}`);
		}
		assert.strictEqual(git.commands.find((c) => c.id === 'git.reset-hard')?.risk, 'destructive');
		for (const command of categories.flatMap((c) => c.commands)) {
			assert.ok(!command.example.includes('${'), `${command.id}: ejemplo sin resolver "${command.example}"`);
			assert.ok(!command.searchText.includes('${'), `${command.id}: searchText sin resolver`);
			assert.strictEqual(command.searchText, command.searchText.toLowerCase(), `${command.id}: searchText con mayúsculas`);
		}
	});
});

suite('Terminal', () => {
	async function api(): Promise<DevCommandsApi> {
		const extension = vscode.extensions.getExtension<DevCommandsApi>(extensionId);
		assert.ok(extension);
		return extension.activate();
	}

	async function closeAllTerminals(): Promise<void> {
		const closing = vscode.window.terminals.map(
			(t) => new Promise<void>((resolve) => {
				const listener = vscode.window.onDidCloseTerminal((closed) => {
					if (closed === t) {
						listener.dispose();
						resolve();
					}
				});
				t.dispose();
			}),
		);
		await Promise.all(closing);
	}

	setup(closeAllTerminals);
	teardown(closeAllTerminals);

	test('un id inexistente no crea ni escribe en ninguna terminal', async () => {
		(await api()).sendToTerminal('git.nope');
		await new Promise((resolve) => setTimeout(resolve, 300));
		assert.strictEqual(vscode.window.terminals.length, 0);
	});

	test('sin terminales, enviar un comando crea la terminal "DevCommands"', async function () {
		this.timeout(15_000);
		const opened = nextEvent(vscode.window.onDidOpenTerminal, 10_000);
		(await api()).sendToTerminal('git.status');
		const terminal = await opened;
		assert.strictEqual(terminal.name, 'DevCommands');
		assert.strictEqual(vscode.window.terminals.length, 1);
	});
});

suite('Portapapeles', () => {
	const sentinel = 'centinela-devcommands';

	async function api(): Promise<DevCommandsApi> {
		const extension = vscode.extensions.getExtension<DevCommandsApi>(extensionId);
		assert.ok(extension);
		return extension.activate();
	}

	setup(() => vscode.env.clipboard.writeText(sentinel));

	test('copiar un comando deja su texto en el portapapeles sin abrir ninguna terminal', async () => {
		const terminalsBefore = vscode.window.terminals.length;
		assert.strictEqual(await (await api()).copyToClipboard('git.status'), true);
		assert.strictEqual(await vscode.env.clipboard.readText(), 'git status');
		assert.strictEqual(vscode.window.terminals.length, terminalsBefore);
	});

	test('un id inexistente no modifica el portapapeles', async () => {
		assert.strictEqual(await (await api()).copyToClipboard('git.nope'), false);
		assert.strictEqual(await vscode.env.clipboard.readText(), sentinel);
	});
});
