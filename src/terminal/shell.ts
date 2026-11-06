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
	const base = baseName(name);
	return base && Object.hasOwn(shellIds, base) ? shellIds[base] : undefined;
}

/** Shells que el catálogo no cubre pero que siguen siendo shells, no programas. */
const otherShells: ReadonlySet<string> = new Set(['fish', 'nu', 'csh', 'tcsh', 'xonsh']);

/**
 * Si un nombre o ruta de ejecutable es un shell (`pwsh`, `/usr/bin/fish`, `wsl.exe`…) y no un
 * programa (`node`, `claude.exe`…). Mismas reglas que `shellIdFromName`.
 */
export function isKnownShell(name: string | undefined): boolean {
	const base = baseName(name);
	return !!base && (Object.hasOwn(shellIds, base) || otherShells.has(base));
}

/** Nombre sin carpeta ni `.exe`, en minúsculas. */
function baseName(name: string | undefined): string | undefined {
	return name
		?.trim()
		.toLowerCase()
		.split(/[\\/]/)
		.pop()
		?.replace(/\.exe$/, '');
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
