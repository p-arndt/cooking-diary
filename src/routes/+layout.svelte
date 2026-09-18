<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import { pwaInfo } from 'virtual:pwa-info'; // @ts-ignore
	import DarkModeToggle from '$lib/components/common/dark-mode-toggle.svelte';
	import { page } from '$app/state';

	let { children } = $props();
	let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" />
	<title>Cooking Diary</title>
	{@html webManifestLink}
</svelte:head>

<Toaster position="top-center" />
<ModeWatcher />
<div class="min-h-screen bg-background text-foreground">
	{#if !page.route.id?.startsWith('/(app)')}
		<div class="absolute top-4 right-4 z-10">
			<DarkModeToggle />
		</div>
	{/if}
	{@render children()}
</div>
