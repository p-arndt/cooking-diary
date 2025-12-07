<script lang="ts">
	import type { Component } from 'svelte';

	type Props = {
		icon?: Component;
		label: string;
		onclick?: () => void;
		class?: string;
	};

	let { icon, label, onclick, class: className }: Props = $props();

	let showFab = $state(true);
	let lastScrollY = $state(0);

	$effect(() => {
		function handleScroll() {
			const currentScrollY = window.scrollY;

			if (currentScrollY < 10) {
				showFab = true;
			} else if (currentScrollY > lastScrollY) {
				showFab = false;
			} else if (currentScrollY < lastScrollY) {
				showFab = true;
			}

			lastScrollY = currentScrollY;
		}

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<button
	class={[
		'fixed right-4 bottom-18 z-100 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl md:bottom-8',
		showFab ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-20 opacity-0',
		className
	]}
	{onclick}
	aria-label={label}
>
	{#if icon}
		{@const Icon = icon}
		<Icon class="h-6 w-6" />
	{/if}
</button>
