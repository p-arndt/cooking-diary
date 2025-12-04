import { paraglideVitePlugin } from '@inlang/paraglide-js';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		}),
		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'prompt',
			manifest: {
				name: 'Cooking Diary',
				short_name: 'Cooking Diary',
				description: 'Track your meals and cooking experiences',
				start_url: '/',
				display: 'fullscreen',
				background_color: '#ffffff',
				theme_color: '#000000',
				icons: [
					{
						src: 'icons/icon-48x48.png',
						sizes: '48x48',
						type: 'image/png'
					},
					{
						src: 'icons/icon-72x72.png',
						sizes: '72x72',
						type: 'image/png'
					},
					{
						src: 'icons/icon-96x96.png',
						sizes: '96x96',
						type: 'image/png'
					},
					{
						src: 'icons/icon-144x144.png',
						sizes: '144x144',
						type: 'image/png'
					},
					{
						src: 'icons/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'icons/icon-180x180.png',
						sizes: '180x180',
						type: 'image/png'
					},
					{
						src: 'icons/icon-167x167.png',
						sizes: '167x167',
						type: 'image/png'
					},
					{
						src: 'icons/icon-152x152.png',
						sizes: '152x152',
						type: 'image/png'
					},
					{
						src: 'icons/icon-120x120.png',
						sizes: '120x120',
						type: 'image/png'
					},
					{
						src: 'icons/icon-76x76.png',
						sizes: '76x76',
						type: 'image/png'
					},
					{
						src: 'icons/icon-70x70.png',
						sizes: '70x70',
						type: 'image/png'
					},
					{
						src: 'icons/icon-150x150.png',
						sizes: '150x150',
						type: 'image/png'
					},
					{
						src: 'icons/icon-310x310.png',
						sizes: '310x310',
						type: 'image/png'
					}
				],
				orientation: 'portrait',
				scope: '/',
				lang: 'en'
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}']
			},
			devOptions: {
				enabled: true,
				type: 'module'
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	},
	optimizeDeps: {
		entries: ['src/**/*.svelte'],
		include: ['better-auth/svelte-kit', '@lucide/svelte'],
		holdUntilCrawlEnd: false
	}
});
