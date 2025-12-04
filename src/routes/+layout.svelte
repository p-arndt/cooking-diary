<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import { pwaInfo } from 'virtual:pwa-info'; // @ts-ignore

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
	{@render children()}
</div>
