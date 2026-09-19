// See https://svelte.dev/docs/kit/types#app.d.ts
// This file is deliberately a global script (no top-level import/export): inside a module,
// `declare module 'virtual:pwa-info'` would be an augmentation of a module TypeScript cannot
// resolve, since vite-plugin-pwa is only a transitive dependency of @vite-pwa/sveltekit.
declare namespace App {
	interface Locals {
		session: import('better-auth').Session | null;
		user:
			| (import('better-auth').User & {
					isAdmin?: boolean | null;
					timezone?: string;
					personalMode?: boolean;
			  })
			| null;
	}
}

declare module 'virtual:pwa-info' {
	export interface PWAInfo {
		webManifest: {
			href: string;
			linkTag: string;
		};
	}
	export const pwaInfo: PWAInfo | undefined;
}
