// Comandos propios en la extensión: lee el ajuste de usuario, lo valida, lo pasa al catálogo,
// informa de lo omitido y ofrece el comando para editarlo.
import * as vscode from 'vscode';
import type { CatalogService } from './catalog/CatalogService';
import { parseCustomCommands, type CustomProblem, type CustomReason } from './catalog/custom';

export const CUSTOM_COMMANDS_SETTING = 'customCommands';
const SECTION = 'devcommands';
const FULL_KEY = `${SECTION}.${CUSTOM_COMMANDS_SETTING}`;
export const EDIT_COMMAND_ID = 'devcommands.editCustomCommands';

/** Texto traducido de cada motivo, para el registro. */
function reasonText(problem: CustomProblem): string {
	const detail = problem.detail ?? '';
	const texts: Record<CustomReason, () => string> = {
		notArray: () => vscode.l10n.t('The setting must be a list of categories.'),
		invalidCategory: () =>
			vscode.l10n.t('The category needs an id (lowercase letters, digits and dashes), a title and a list of commands.'),
		duplicateCategory: () => vscode.l10n.t('Another category already uses this id.'),
		emptyCategory: () => vscode.l10n.t('The category has no valid commands.'),
		invalidCommand: () =>
			vscode.l10n.t('The command needs an id (lowercase letters, digits and dashes) and a command; each parameter needs a valid name.'),
		duplicateCommand: () => vscode.l10n.t('Another command in this category already uses this id.'),
		invalidText: () => vscode.l10n.t('A text is empty, too long, has line breaks or uses an unknown language: {0}', detail),
		invalidRisk: () => vscode.l10n.t('risk must be safe, caution or destructive, not "{0}".', detail),
		controlChars: () => vscode.l10n.t("The command can't contain line breaks or control characters: {0}", detail),
		tooLong: () => vscode.l10n.t("The command can't be longer than 1000 characters: {0}", detail),
		undeclaredParam: () => vscode.l10n.t('The placeholder {0} is not declared in params.', `\${${detail}}`),
		unusedParam: () => vscode.l10n.t('The parameter {0} is not used in command.', detail),
		duplicateParam: () => vscode.l10n.t('Repeated parameters: {0}', detail),
		invalidShell: () => vscode.l10n.t('shells only accepts bash, zsh, powershell and cmd, not "{0}".', detail),
		tooMany: () => vscode.l10n.t('Only the first 50 categories and 200 commands are loaded.'),
	};
	return texts[problem.reason]();
}

/** Valor del ajuste en la configuración de usuario (se ignora cualquier valor de un espacio de trabajo). */
function userValue(): unknown {
	return vscode.workspace.getConfiguration(SECTION).inspect(CUSTOM_COMMANDS_SETTING)?.globalValue;
}

/** Abre settings.json de usuario en el ajuste. */
async function openSetting(): Promise<void> {
	await vscode.commands.executeCommand('workbench.action.openSettingsJson', {
		revealSetting: { key: FULL_KEY, edit: true },
	});
}

/** Categoría de ejemplo, con textos en el idioma activo, para un ajuste vacío. */
function example(): unknown[] {
	return [
		{
			id: 'example',
			title: vscode.l10n.t('Example'),
			icon: 'rocket',
			commands: [
				{
					id: 'say-hello',
					title: vscode.l10n.t('Say hello'),
					description: vscode.l10n.t('Writes a message with echo'),
					command: 'echo ${message}',
					params: [
						{
							name: 'message',
							label: vscode.l10n.t('Message'),
							placeholder: vscode.l10n.t('Hello from DevCommands'),
						},
					],
					risk: 'safe',
				},
			],
		},
	];
}

/**
 * Carga los comandos propios en el catálogo ahora y cada vez que cambia el ajuste, registra lo
 * omitido y avisa (sin repetir el aviso si los problemas no cambian). Registra el comando de edición.
 */
export function registerCustomCommands(catalog: CatalogService, log: vscode.LogOutputChannel): vscode.Disposable {
	let lastProblems = '';

	const load = () => {
		const { categories, problems } = parseCustomCommands(userValue());
		catalog.setCustomCategories(categories);
		log.info('Comandos propios:', categories.reduce((n, c) => n + c.commands.length, 0));
		for (const problem of problems) {
			log.warn('Comando propio omitido:', problem.where, reasonText(problem));
		}
		const key = JSON.stringify(problems);
		if (problems.length > 0 && key !== lastProblems) {
			const openSettings = vscode.l10n.t('Open Settings');
			const showLog = vscode.l10n.t('Show Log');
			void vscode.window
				.showWarningMessage(
					vscode.l10n.t('{0} custom commands or categories were skipped because they are not valid.', problems.length),
					openSettings,
					showLog,
				)
				.then((choice) => {
					if (choice === openSettings) {
						void openSetting();
					} else if (choice === showLog) {
						log.show();
					}
				});
		}
		lastProblems = key;
	};

	load();
	return vscode.Disposable.from(
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration(FULL_KEY)) {
				load();
			}
		}),
		vscode.commands.registerCommand(EDIT_COMMAND_ID, async () => {
			const current = userValue();
			if (!Array.isArray(current) || current.length === 0) {
				await vscode.workspace
					.getConfiguration(SECTION)
					.update(CUSTOM_COMMANDS_SETTING, example(), vscode.ConfigurationTarget.Global);
			}
			await openSetting();
		}),
	);
}
