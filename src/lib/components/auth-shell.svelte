<script lang="ts">
	import type { Snippet } from 'svelte';
	import logo from '$lib/assets/logo.png';
	import * as m from '$lib/paraglide/messages.js';

	type Props = {
		title: string;
		subtitle?: string;
		children: Snippet;
	};

	let { title, subtitle, children }: Props = $props();
</script>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
	<div
		class="pointer-events-none absolute -top-40 -left-32 size-[28rem] rounded-full bg-primary/25 blur-3xl"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none absolute -right-32 -bottom-40 size-[26rem] rounded-full bg-accent/20 blur-3xl"
		aria-hidden="true"
	></div>

	<div class="relative w-full max-w-md">
		<div class="mb-8 flex flex-col items-center text-center">
			<div
				class="mb-5 flex size-20 items-center justify-center rounded-[1.75rem] bg-primary shadow-lifted"
			>
				<img src={logo} alt="{m.common_appName()} logo" class="size-14" />
			</div>
			<h1 class="text-3xl font-extrabold">{title}</h1>
			{#if subtitle}
				<p class="mt-2 max-w-sm text-muted-foreground">{subtitle}</p>
			{/if}
		</div>

		<div
			class="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-lifted backdrop-blur-xl sm:p-8"
		>
			{@render children()}
		</div>

		<p class="mt-6 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
			{m.common_appName()}
		</p>
	</div>
</div>
