import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		csp: {
			// SvelteKit adds a per-request nonce (or a hash on prerendered pages) to script-src
			// for its own inline bootstrap script; mode-watcher's inline script reuses that nonce.
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				// bits-ui, svelte-sonner and Svelte transitions write inline styles at runtime.
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'blob:'],
				'font-src': ['self', 'data:'],
				'connect-src': ['self'],
				'worker-src': ['self'],
				'manifest-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none']
			}
		}
	}
};

export default config;
