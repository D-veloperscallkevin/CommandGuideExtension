// Módulos que genera esbuild.js en el build (no existen en disco).

declare module 'virtual:project-signals' {
	/** Categorías del catálogo con su campo `detect`, ordenadas por id (forma de `SignalSource`). */
	const categories: readonly { readonly id: string; readonly detect?: readonly string[] }[];
	export default categories;
}
