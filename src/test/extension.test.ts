import * as assert from 'assert';
import * as vscode from 'vscode';
import type { DevCommandsApi } from '../extension';
import { sponsorUrl } from '../sponsor/sponsorLink';
import { resolveTargetShell } from '../terminal/shell';

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
	test('se activa tras el arranque sin crear la vista; al abrirla completa el handshake y envía el catálogo', async function () {
		this.timeout(20_000);
		const extension = vscode.extensions.getExtension<DevCommandsApi>(extensionId);
		assert.ok(extension, `no se encuentra la extensión ${extensionId}`);

		// onStartupFinished: activa sin abrir la vista, y sin catálogo enviado (no hay webview).
		const deadline = Date.now() + 10_000;
		while (!extension.isActive && Date.now() < deadline) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		assert.strictEqual(extension.isActive, true, 'debe activarse al terminar el arranque');
		const api = extension.exports;
		assert.strictEqual(api.isCatalogLoaded(), false, 'no debe leer el catálogo al activarse');
		// La detección usa las señales del bundle, no los archivos del catálogo.
		assert.deepStrictEqual(await api.detectProject(), ['node', 'pnpm']);
		assert.strictEqual(api.isCatalogLoaded(), false, 'detectar el proyecto no debe leer el catálogo');
		let sentBeforeOpening = false;
		const early = api.onDidSendCatalog(() => {
			sentBeforeOpening = true;
		});
		await new Promise((resolve) => setTimeout(resolve, 300));
		early.dispose();
		assert.strictEqual(sentBeforeOpening, false, 'no debe enviar el catálogo antes de abrir la vista');

		const catalogSent = nextEvent(api.onDidSendCatalog, 10_000);
		await vscode.commands.executeCommand('workbench.view.extension.devcommands');
		const { shell, categories } = await catalogSent;
		assert.strictEqual(api.isCatalogLoaded(), true, 'al abrir la vista lee el catálogo');

		assert.strictEqual(extension.isActive, true);
		assert.deepStrictEqual(
			categories.map((c) => c.id),
			['git', 'npm', 'pnpm', 'yarn', 'bun', 'node', 'deno', 'typescript', 'version-managers', 'docker', 'terminal'],
		);
		const git = categories.find((c) => c.id === 'git');
		assert.ok(git, 'el catálogo enviado no incluye git');
		assert.strictEqual(git.icon, 'git-branch');
		const gitIds = git.commands.map((c) => c.id);
		for (const id of ['git.status', 'git.new-branch', 'git.reset-hard']) {
			assert.ok(gitIds.includes(id), `git no incluye ${id}`);
		}
		assert.strictEqual(git.commands.find((c) => c.id === 'git.reset-hard')?.risk, 'destructive');

		// Sin terminales abiertas, el shell de destino es el del perfil por defecto del entorno.
		assert.strictEqual(vscode.window.terminals.length, 0);
		assert.strictEqual(shell, resolveTargetShell({ defaultShell: vscode.env.shell }, process.platform));
		const removeDirectory = categories
			.find((c) => c.id === 'terminal')
			?.commands.find((c) => c.id === 'terminal.remove-directory')?.example;
		const expectedStart = { powershell: 'Remove-Item -Recurse -Force ', cmd: 'rmdir /s /q ', bash: 'rm -rf ', zsh: 'rm -rf ' }[shell];
		assert.ok(removeDirectory?.startsWith(expectedStart), `ejemplo para ${shell}: "${removeDirectory}"`);
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

suite('Favoritos', () => {
	async function api(): Promise<DevCommandsApi> {
		const extension = vscode.extensions.getExtension<DevCommandsApi>(extensionId);
		assert.ok(extension);
		return extension.activate();
	}

	test('alternar un favorito envía la lista nueva y deshacerlo la deja como estaba', async () => {
		const devCommands = await api();
		let sent = nextEvent(devCommands.onDidSendFavorites, 5_000);
		await devCommands.toggleFavorite('git.status');
		assert.deepStrictEqual(await sent, ['git.status']);
		sent = nextEvent(devCommands.onDidSendFavorites, 5_000);
		await devCommands.toggleFavorite('git.status');
		assert.deepStrictEqual(await sent, []);
	});

	test('un id inexistente no envía nada', async () => {
		const devCommands = await api();
		const sent = nextEvent(devCommands.onDidSendFavorites, 500);
		await devCommands.toggleFavorite('git.nope');
		await assert.rejects(sent);
	});
});

suite('Historial', () => {
	async function api(): Promise<DevCommandsApi> {
		const extension = vscode.extensions.getExtension<DevCommandsApi>(extensionId);
		assert.ok(extension);
		return extension.activate();
	}

	teardown(async () => (await api()).clearHistory());

	test('borrar el historial envía la lista vacía', async () => {
		const devCommands = await api();
		const sent = nextEvent(devCommands.onDidSendHistory, 5_000);
		await devCommands.clearHistory();
		assert.deepStrictEqual(await sent, []);
	});

	test('enviar un comando lo registra y reenviarlo mantiene una sola entrada con la misma clave', async function () {
		this.timeout(20_000);
		const devCommands = await api();
		await devCommands.clearHistory();
		let sent = nextEvent(devCommands.onDidSendHistory, 15_000);
		devCommands.sendToTerminal('git.status');
		const [first, ...rest] = await sent;
		assert.deepStrictEqual(rest, []);
		assert.strictEqual(first.commandId, 'git.status');
		assert.strictEqual(first.text, 'git status');

		sent = nextEvent(devCommands.onDidSendHistory, 15_000);
		await devCommands.sendRecent(first.id);
		assert.deepStrictEqual(await sent, [first]);
	});

	test('copiar un comando no lo registra', async () => {
		const devCommands = await api();
		const sent = nextEvent(devCommands.onDidSendHistory, 500);
		assert.strictEqual(await devCommands.copyToClipboard('git.status'), true);
		await assert.rejects(sent);
	});

	test('una entrada desconocida no escribe nada ni cambia el historial', async () => {
		const devCommands = await api();
		const sent = nextEvent(devCommands.onDidSendHistory, 500);
		await devCommands.sendRecent('no-existe');
		await assert.rejects(sent);
	});
});

suite('Detección del proyecto', () => {
	async function api(): Promise<DevCommandsApi> {
		const extension = vscode.extensions.getExtension<DevCommandsApi>(extensionId);
		assert.ok(extension);
		return extension.activate();
	}

	/** Siguiente `catalog` cuyo `detected` cumple la condición. */
	function catalogWhere(devCommands: DevCommandsApi, accept: (detected: readonly string[]) => boolean, ms: number) {
		return new Promise<readonly string[]>((resolve, reject) => {
			const timer = setTimeout(() => {
				subscription.dispose();
				reject(new Error(`no llegó el catalog esperado en ${ms} ms`));
			}, ms);
			const subscription = devCommands.onDidSendCatalog(({ detected }) => {
				if (accept(detected)) {
					clearTimeout(timer);
					subscription.dispose();
					resolve(detected);
				}
			});
		});
	}

	test('detecta pnpm y Node en la carpeta de prueba', async () => {
		const devCommands = await api();
		assert.deepStrictEqual(await devCommands.detectProject(), ['node', 'pnpm']);
	});

	test('crear y borrar un Dockerfile actualiza detected en vivo, en el orden del catálogo', async function () {
		this.timeout(20_000);
		const devCommands = await api();
		const folder = vscode.workspace.workspaceFolders?.[0];
		assert.ok(folder, 'los tests deben abrir test/fixtures/workspace');
		const dockerfile = vscode.Uri.joinPath(folder.uri, 'Dockerfile');
		try {
			const added = catalogWhere(devCommands, (d) => d.includes('docker'), 10_000);
			await vscode.workspace.fs.writeFile(dockerfile, new Uint8Array());
			assert.deepStrictEqual(await added, ['pnpm', 'node', 'docker']);
		} finally {
			const removed = catalogWhere(devCommands, (d) => !d.includes('docker'), 10_000);
			await vscode.workspace.fs.delete(dockerfile);
			assert.deepStrictEqual(await removed, ['pnpm', 'node']);
		}
	});

	test('crear y borrar un Containerfile (señal nueva) actualiza detected en vivo', async function () {
		this.timeout(20_000);
		const devCommands = await api();
		const folder = vscode.workspace.workspaceFolders?.[0];
		assert.ok(folder, 'los tests deben abrir test/fixtures/workspace');
		const containerfile = vscode.Uri.joinPath(folder.uri, 'Containerfile');
		try {
			const added = catalogWhere(devCommands, (d) => d.includes('docker'), 10_000);
			await vscode.workspace.fs.writeFile(containerfile, new Uint8Array());
			assert.deepStrictEqual(await added, ['pnpm', 'node', 'docker']);
		} finally {
			const removed = catalogWhere(devCommands, (d) => !d.includes('docker'), 10_000);
			await vscode.workspace.fs.delete(containerfile);
			assert.deepStrictEqual(await removed, ['pnpm', 'node']);
		}
	});

	test('con detectProject en false no se detecta nada', async function () {
		this.timeout(15_000);
		const devCommands = await api();
		const config = vscode.workspace.getConfiguration('devcommands');
		try {
			const off = catalogWhere(devCommands, (d) => d.length === 0, 10_000);
			await config.update('detectProject', false, vscode.ConfigurationTarget.Global);
			assert.deepStrictEqual(await off, []);
		} finally {
			const on = catalogWhere(devCommands, (d) => d.length > 0, 10_000);
			await config.update('detectProject', undefined, vscode.ConfigurationTarget.Global);
			assert.deepStrictEqual(await on, ['pnpm', 'node']);
		}
	});
});

suite('Buscador de la paleta', () => {
	async function api(): Promise<DevCommandsApi> {
		const extension = vscode.extensions.getExtension<DevCommandsApi>(extensionId);
		assert.ok(extension);
		return extension.activate();
	}

	test('el comando está registrado', async () => {
		await api();
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('devcommands.searchCommands'));
	});

	test('con el cuadro vacío, las categorías del proyecto van antes que el resto', async () => {
		const devCommands = await api();
		await devCommands.detectProject();
		const separators = devCommands
			.searchEntries('')
			.flatMap((e) => (e.kind === 'separator' ? [e.label] : []))
			// Favoritos y Recientes dependen de lo que hayan hecho otros tests.
			.filter((label) => !['Favorites', 'Recent'].includes(label));
		assert.deepStrictEqual(separators.slice(0, 2), ['pnpm', 'Node.js']);
		assert.ok(separators.includes('Git'));
	});

	test('al escribir usa la búsqueda del panel, sin separadores', async () => {
		const devCommands = await api();
		const entries = devCommands.searchEntries('status');
		assert.ok(entries.length > 0);
		assert.ok(entries.every((e) => e.kind === 'command'));
		assert.ok(entries.some((e) => e.kind === 'command' && e.commandId === 'git.status'));
		assert.deepStrictEqual(devCommands.searchEntries('zzzz-no-existe'), []);
	});
});

suite('Comandos propios', () => {
	async function api(): Promise<DevCommandsApi> {
		const extension = vscode.extensions.getExtension<DevCommandsApi>(extensionId);
		assert.ok(extension);
		return extension.activate();
	}

	const demo = [
		{
			id: 'demo',
			title: 'Demo',
			commands: [
				{ id: 'hola', title: 'Hola', command: 'echo hola-devcommands' },
				{ id: 'roto', title: 'Roto', command: 'ssh ${host}' },
			],
		},
	];

	test('al guardar el ajuste, el catálogo incluye la categoría propia al final y se puede copiar', async function () {
		this.timeout(15_000);
		const devCommands = await api();
		const config = vscode.workspace.getConfiguration('devcommands');
		try {
			const sent = nextEvent(devCommands.onDidSendCatalog, 10_000);
			await config.update('customCommands', demo, vscode.ConfigurationTarget.Global);
			const { categories } = await sent;
			const last = categories[categories.length - 1];
			assert.strictEqual(last.id, 'custom-demo');
			// El comando con un placeholder sin declarar se omite; el válido se carga.
			assert.deepStrictEqual(
				last.commands.map((c) => [c.id, c.example]),
				[['custom-demo.hola', 'echo hola-devcommands']],
			);
			assert.strictEqual(await devCommands.copyToClipboard('custom-demo.hola'), true);
			assert.strictEqual(await vscode.env.clipboard.readText(), 'echo hola-devcommands');
		} finally {
			const restored = nextEvent(devCommands.onDidSendCatalog, 10_000);
			await config.update('customCommands', undefined, vscode.ConfigurationTarget.Global);
			const { categories } = await restored;
			assert.ok(!categories.some((c) => c.id.startsWith('custom-')));
		}
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

	test('cancelar el cuadro del valor de un comando con parámetros no modifica el portapapeles', async function () {
		this.timeout(10_000);
		const copied = (await api()).copyToClipboard('git.new-branch');
		// Deja que se abra el cuadro y lo cierra como lo haría Escape.
		await new Promise((resolve) => setTimeout(resolve, 500));
		await vscode.commands.executeCommand('workbench.action.closeQuickOpen');
		assert.strictEqual(await copied, false);
		assert.strictEqual(await vscode.env.clipboard.readText(), sentinel);
	});

	test('con la confirmación desactivada, un comando destructivo se copia sin aviso', async () => {
		const config = vscode.workspace.getConfiguration('devcommands');
		await config.update('confirmDestructive', false, vscode.ConfigurationTarget.Global);
		try {
			assert.strictEqual(await (await api()).copyToClipboard('git.reset-hard'), true);
			assert.strictEqual(await vscode.env.clipboard.readText(), 'git reset --hard');
		} finally {
			await config.update('confirmDestructive', undefined, vscode.ConfigurationTarget.Global);
		}
	});
});

suite('Patrocinio', () => {
	test('el manifiesto de la extensión instalada declara una URL de GitHub Sponsors válida', () => {
		const extension = vscode.extensions.getExtension(extensionId);
		assert.ok(extension);
		assert.strictEqual(sponsorUrl(extension.packageJSON), 'https://github.com/sponsors/D-veloperscallkevin');
	});
});
