<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import type { Snippet } from 'svelte';
	import { ArrowLeft } from '@lucide/svelte';

	type Props = {
		title: string;
		subtitle?: string;
		backHref?: ResolvedPathname;
		backLabel?: string;
		actions?: Snippet;
	};

	let { title, subtitle, backHref, backLabel, actions }: Props = $props();
</script>

<header class="space-y-4">
	{#if backHref}
		<a
			href={backHref}
			class="inline-flex items-center gap-2 rounded-full bg-secondary py-1.5 pr-4 pl-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70"
		>
			<ArrowLeft class="size-4" />
			{backLabel}
		</a>
	{/if}
	<div class="flex items-end justify-between gap-4">
		<div class="min-w-0">
			<h1 class="text-3xl font-extrabold md:text-4xl">{title}</h1>
			{#if subtitle}
				<p class="mt-1 text-sm font-medium text-muted-foreground md:text-base">{subtitle}</p>
			{/if}
		</div>
		{#if actions}
			<div class="flex shrink-0 items-center gap-2">
				{@render actions()}
			</div>
		{/if}
	</div>
</header>
