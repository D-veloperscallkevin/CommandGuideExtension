// Favoritos: lista de ids de comandos en el orden en que se marcaron, guardada en el almacenamiento
// global de la extensión. No depende de `vscode`: el almacenamiento y el catálogo se inyectan.

/** Lo que se usa de `vscode.Memento` (`context.globalState`). */
export interface FavoritesMemento {
	get(key: string): unknown;
	update(key: string, value: unknown): Thenable<void>;
}

export class FavoritesStore {
	/** Clave en `globalState`; se registra con `setKeysForSync` para Settings Sync. */
	static readonly key = 'favorites';

	/**
	 * @param exists Dice si un id es de un comando del catálogo. Los ids que no lo son se ignoran
	 * al leer y se eliminan en el siguiente guardado.
	 */
	constructor(
		private readonly memento: FavoritesMemento,
		private readonly exists: (commandId: string) => boolean,
	) {}

	/** Favoritos válidos, sin duplicados, en orden de marcado. No escribe nada. */
	list(): string[] {
		const saved = this.memento.get(FavoritesStore.key);
		if (!Array.isArray(saved)) {
			return [];
		}
		const ids = saved.filter((id): id is string => typeof id === 'string' && this.exists(id));
		return [...new Set(ids)];
	}

	/**
	 * Marca el comando si no era favorito (al final) o lo desmarca si lo era, guarda la lista y la
	 * devuelve. Con un id que no es del catálogo devuelve `undefined` y no guarda nada.
	 */
	async toggle(commandId: string): Promise<string[] | undefined> {
		if (!this.exists(commandId)) {
			return undefined;
		}
		const current = this.list();
		const next = current.includes(commandId) ? current.filter((id) => id !== commandId) : [...current, commandId];
		await this.memento.update(FavoritesStore.key, next);
		return next;
	}
}
