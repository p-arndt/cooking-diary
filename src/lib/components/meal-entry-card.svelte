<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ChefHat } from '@lucide/svelte';

	type Meal = {
		id: string;
		title: string;
		defaultPhotoUrl: string | null;
		categories: Array<{ id: string; name: string }>;
	};

	type Entry = {
		id: string;
		meal: Meal;
		notes: string | null;
		photoUrls: string[] | null;
	};

	type Props = {
		entry?: Entry;
		meal?: Meal;
		onclick?: () => void;
	};

	let { entry, meal, onclick }: Props = $props();

	const displayMeal = $derived(entry?.meal || meal);
	const photoUrl = $derived(entry?.photoUrls?.[0] || displayMeal?.defaultPhotoUrl);
	const notes = $derived(entry?.notes);
</script>

<Card class={onclick ? 'cursor-pointer transition-all hover:shadow-md' : ''} {onclick}>
	<CardContent>
		<div class="flex items-start gap-4">
			{#if photoUrl}
				<div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
					<img src={photoUrl} alt={displayMeal?.title} class="h-full w-full object-cover" />
				</div>
			{:else}
				<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
					<ChefHat class="h-8 w-8 text-muted-foreground" />
				</div>
			{/if}
			<div class="flex-1">
				<h3 class="font-semibold">{displayMeal?.title}</h3>
				{#if displayMeal && displayMeal.categories.length > 0}
					<div class="mt-1 flex flex-wrap gap-1">
						{#each displayMeal.categories as category}
							<Badge variant="secondary" class="text-xs">
								{category.name}
							</Badge>
						{/each}
					</div>
				{/if}
				{#if notes}
					<p class="mt-2 text-sm text-muted-foreground">{notes}</p>
				{/if}
			</div>
		</div>
	</CardContent>
</Card>
