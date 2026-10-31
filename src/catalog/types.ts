// Tipos del catálogo. Reflejan catalog/schema.json: si cambias uno, cambia el otro.

export type Locale = 'en' | 'es';

export type ShellId = 'bash' | 'zsh' | 'powershell' | 'cmd';

export type Risk = 'safe' | 'caution' | 'destructive';

export type LocalizedString = Readonly<Record<Locale, string>>;

export type LocalizedTags = Readonly<Record<Locale, readonly string[]>>;

export interface Param {
	readonly name: string;
	readonly label: LocalizedString;
	readonly placeholder: LocalizedString;
}

export interface Command {
	readonly id: string;
	readonly title: LocalizedString;
	readonly description: LocalizedString;
	/** Plantilla POSIX (bash/zsh) con placeholders `${param}`. */
	readonly command: string;
	readonly params?: readonly Param[];
	readonly tags: LocalizedTags;
	readonly risk: Risk;
	readonly shells?: Readonly<Partial<Record<ShellId, string>>>;
	readonly docs?: string;
}

export interface Category {
	readonly version: 1;
	readonly id: string;
	readonly title: LocalizedString;
	/** Nombre de un Codicon de VS Code. */
	readonly icon: string;
	readonly order: number;
	readonly commands: readonly Command[];
}

export type Catalog = readonly Category[];
