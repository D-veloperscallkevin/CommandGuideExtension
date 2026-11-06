// `ProjectDetector` sobre la API de VS Code: carpetas del workspace, `workspace.fs.readDirectory` (vale
// también para sistemas de archivos remotos y virtuales), watchers por carpeta y el ajuste.
import * as vscode from 'vscode';
import type { ProjectSignal } from './detect';
import { ProjectDetector, type ProjectWorkspace } from './ProjectDetector';

const SECTION = 'devcommands';
const SETTING = 'detectProject';

const workspace: ProjectWorkspace<vscode.Uri> = {
	folders: () => (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri),
	onDidChangeFolders: vscode.workspace.onDidChangeWorkspaceFolders,
	// Solo los nombres; un error (carpeta inexistente, sin permisos) lo trata detectCategories.
	list: async (folder, dir) => {
		const entries = await vscode.workspace.fs.readDirectory(dir === undefined ? folder : vscode.Uri.joinPath(folder, dir));
		return entries.map(([name]) => name);
	},
	watch: (folder, glob, onChange) => {
		// Solo importan la creación y el borrado; el contenido no se lee.
		const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, glob), false, true, false);
		return vscode.Disposable.from(watcher, watcher.onDidCreate(onChange), watcher.onDidDelete(onChange));
	},
	enabled: () => vscode.workspace.getConfiguration(SECTION).get<boolean>(SETTING, true),
	onDidChangeEnabled: (listener) =>
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration(`${SECTION}.${SETTING}`)) {
				listener(event);
			}
		}),
};

/** Detector de las categorías del proyecto abierto, con recarga en vivo. */
export function createProjectDetector(signals: readonly ProjectSignal[]): ProjectDetector<vscode.Uri> {
	return new ProjectDetector(workspace, signals);
}
