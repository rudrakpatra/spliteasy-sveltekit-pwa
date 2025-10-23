// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import 'vite-plugin-pwa/svelte';
import 'vite-plugin-pwa/info';

declare global {
	namespace App {
		interface Locals {
			user: import('$lib/server/auth').AuthUser | null;
		}
	} // interface Error {}
	// interface Locals {}
} // interface PageData {}
// interface PageState {}

// interface Platform {}
export { };