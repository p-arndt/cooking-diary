// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
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
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
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

export {};
