// Traduce el shell de una terminal a una variante del catálogo. Sin `vscode`: se testea con Vitest.
import { defaultShellFor } from '../catalog/CatalogService';
import type { ShellId } from '../catalog/types';

const shellIds: Readonly<Record<string, ShellId>> = {
	pwsh: 'powershell',
	powershell: 'powershell',
	bash: 'bash',
	sh: 'bash',
	gitbash: 'bash',
	wsl: 'bash',
	ksh: 'bash',
	dash: 'bash',
	zsh: 'zsh',
	cmd: 'cmd',
};

/**
 * Variante del catálogo para un nombre de shell (`pwsh`, `gitbash`…) o la ruta de su
 * ejecutable (`C:\…\powershell.exe`, `/usr/bin/zsh`). Sin distinguir mayúsculas, sin la
 * carpeta ni `.exe`. Un shell que el catálogo no cubre (`fish`, `nu`…) devuelve `undefined`.
 */
export function shellIdFromName(name: string | undefined): ShellId | undefined {
	const base = name
		?.trim()
		.toLowerCase()
		.split(/[\\/]/)
		.pop()
		?.replace(/\.exe$/, '');
	return base ? shellIds[base] : undefined;
}

/** Lo que se sabe del shell de la terminal de destino, de más a menos fiable. */
export interface ShellSources {
	/** Tipo de shell que VS Code ha detectado en la terminal activa. */
	readonly detected?: string;
	/** Ejecutable con el que se creó la terminal activa. */
	readonly shellPath?: string;
	/** Shell del perfil por defecto del usuario. */
	readonly defaultShell?: string;
}

/** Primer dato que se traduce a una variante; si ninguno, la del sistema operativo. */
export function resolveTargetShell(sources: ShellSources, platform: string): ShellId {
	return (
		shellIdFromName(sources.detected) ??
		shellIdFromName(sources.shellPath) ??
		shellIdFromName(sources.defaultShell) ??
		defaultShellFor(platform)
	);
}
