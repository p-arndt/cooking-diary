<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import { pwaInfo } from 'virtual:pwa-info';
	import DarkModeToggle from '$lib/components/common/dark-mode-toggle.svelte';
	import { page } from '$app/state';

	let { children } = $props();
	let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" />
	<title>Cooking Diary</title>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-time manifest link from vite-plugin-pwa, no user input -->
	{@html webManifestLink}
</svelte:head>

<Toaster position="top-center" />
<ModeWatcher nonce="%csp.nonce%" />
<div class="min-h-screen bg-background text-foreground">
	{#if !page.route.id?.startsWith('/(app)')}
		<div class="absolute top-4 right-4 z-10">
			<DarkModeToggle />
		</div>
	{/if}
	{@render children()}
</div>
