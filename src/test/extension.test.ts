import * as assert from 'assert';
import * as vscode from 'vscode';
import type { DevCommandsApi } from '../extension';

// Por nombre de paquete: el publisher aún no está decidido (change 2.9).
const packageName = 'devcommands';

/** Espera al siguiente evento o falla tras `ms` milisegundos. */
function nextEvent(event: vscode.Event<void>, ms: number): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			listener.dispose();
			reject(new Error(`sin evento tras ${ms} ms`));
		}, ms);
		const listener = event(() => {
			clearTimeout(timer);
			listener.dispose();
			resolve();
		});
	});
}

suite('Vista lateral', () => {
	test('al abrir la vista, la extensión se activa y el webview completa el handshake', async function () {
		this.timeout(20_000);
		const extension = vscode.extensions.all.find((e) => e.packageJSON.name === packageName) as
			| vscode.Extension<DevCommandsApi>
			| undefined;
		assert.ok(extension, `no se encuentra la extensión ${packageName}`);
		assert.strictEqual(extension.isActive, false, 'no debe activarse antes de abrir la vista');

		await vscode.commands.executeCommand('workbench.view.extension.devcommands');
		const api = await extension.activate();
		await nextEvent(api.onDidReceiveReady, 10_000);

		assert.strictEqual(extension.isActive, true);
	});
});
