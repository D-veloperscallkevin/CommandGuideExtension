// Historial: los últimos comandos escritos en la terminal con los valores de sus parámetros,
// del más reciente al más antiguo, en el almacenamiento global de la extensión de este equipo
// (sin Settings Sync). No depende de `vscode`: el almacenamiento, el catálogo y los ids se inyectan.

import { basicValueError } from '../params/escape';

/** Lo que se usa de `vscode.Memento` (`context.globalState`). */
export interface HistoryMemento {
	get(key: string): unknown;
	update(key: string, value: unknown): Thenable<void>;
}

/** Una entrada: el comando y los valores aceptados de sus parámetros (no el texto final). */
export interface HistoryEntry {
	readonly id: string;
	readonly commandId: string;
	readonly values: Readonly<Record<string, string>>;
}

/** Número máximo de entradas guardadas. */
export const MAX_HISTORY = 20;

/** Forma de la clave de una entrada (la que viaja en `sendRecent` y `copyRecent`). */
export const ENTRY_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

const sameValues = (a: Readonly<Record<string, string>>, b: Readonly<Record<string, string>>): boolean => {
	const keys = Object.keys(a);
	return keys.length === Object.keys(b).length && keys.every((k) => Object.hasOwn(b, k) && a[k] === b[k]);
};

export class HistoryStore {
	/** Clave en `globalState`. No se registra para Settings Sync. */
	static readonly key = 'history';

	/**
	 * @param paramsOf Nombres de los parámetros del comando, o `undefined` si no está en el catálogo.
	 * @param newId Genera la clave de una entrada nueva (en la extensión, `randomUUID`).
	 */
	constructor(
		private readonly memento: HistoryMemento,
		private readonly paramsOf: (commandId: string) => readonly string[] | undefined,
		private readonly newId: () => string,
	) {}

	/**
	 * Entradas válidas, de la más reciente a la más antigua, como máximo `MAX_HISTORY`. Omite lo que
	 * no tiene la forma esperada, los ids repetidos, los comandos que ya no existen y los valores que
	 * no encajan con sus parámetros actuales. No escribe nada.
	 */
	list(): HistoryEntry[] {
		const saved = this.memento.get(HistoryStore.key);
		if (!Array.isArray(saved)) {
			return [];
		}
		const seen = new Set<string>();
		const entries: HistoryEntry[] = [];
		for (const item of saved) {
			const entry = this.parse(item);
			if (entry && !seen.has(entry.id)) {
				seen.add(entry.id);
				entries.push(entry);
			}
		}
		return entries.slice(0, MAX_HISTORY);
	}

	/** La entrada con esa clave, o `undefined` si ya no está. */
	get(entryId: string): HistoryEntry | undefined {
		return this.list().find((entry) => entry.id === entryId);
	}

	/**
	 * Registra un envío al principio y devuelve el historial guardado. Si ya había una entrada con el
	 * mismo comando y los mismos valores, la mueve (conservando su clave) en lugar de duplicarla.
	 */
	async record(commandId: string, values: ReadonlyMap<string, string>): Promise<HistoryEntry[]> {
		const record = Object.fromEntries(values);
		const current = this.list();
		const previous = current.find((entry) => entry.commandId === commandId && sameValues(entry.values, record));
		const entry: HistoryEntry = { id: previous?.id ?? this.newId(), commandId, values: record };
		const next = [entry, ...current.filter((e) => e !== previous)].slice(0, MAX_HISTORY);
		await this.memento.update(HistoryStore.key, next);
		return next;
	}

	/** Vacía el historial. */
	async clear(): Promise<void> {
		await this.memento.update(HistoryStore.key, []);
	}

	private parse(item: unknown): HistoryEntry | undefined {
		if (!isPlainObject(item)) {
			return undefined;
		}
		const { id, commandId, values } = item;
		if (typeof id !== 'string' || !ENTRY_ID_PATTERN.test(id) || typeof commandId !== 'string' || !isPlainObject(values)) {
			return undefined;
		}
		const params = this.paramsOf(commandId);
		if (!params) {
			return undefined;
		}
		const keys = Object.keys(values);
		if (keys.length !== params.length || !params.every((name) => Object.hasOwn(values, name))) {
			return undefined;
		}
		const parsed: Record<string, string> = {};
		for (const name of params) {
			const value = values[name];
			if (typeof value !== 'string' || basicValueError(value) !== undefined) {
				return undefined;
			}
			parsed[name] = value;
		}
		return { id, commandId, values: parsed };
	}
}
