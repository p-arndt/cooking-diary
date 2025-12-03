<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ArrowLeft, Edit, ChefHat } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	async function cookToday() {
		const today = new Date().toISOString().split('T')[0];
		goto(`/entries/add?step=3&date=${today}&mealId=${data.meal.id}`);
	}
</script>

<svelte:head>
	<title>{data.meal.title} - Cooking Diary</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8">
	<!-- Back Button -->
	<Button variant="ghost" onclick={() => goto('/meals')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Meals
	</Button>

	<!-- Meal Header -->
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1">
			<h1 class="text-4xl font-bold tracking-tight">{data.meal.title}</h1>
			{#if data.meal.categories.length > 0}
				<div class="mt-2 flex flex-wrap gap-2">
					{#each data.meal.categories as category}
						<Badge variant="secondary">{category.name}</Badge>
					{/each}
				</div>
			{/if}
		</div>
		<Button variant="outline" onclick={() => goto(`/meals/${data.meal.id}/edit`)}>
			<Edit class="mr-2 h-4 w-4" />
			Edit Meal
		</Button>
	</div>

	<!-- Meal Photo -->
	{#if data.meal.defaultPhotoUrl}
		<Card>
			<CardContent class="p-0">
				<div class="aspect-video w-full overflow-hidden rounded-lg">
					<img
						src={data.meal.defaultPhotoUrl}
						alt={data.meal.title}
						class="h-full w-full object-cover"
					/>
				</div>
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent class="pt-6">
				<div class="flex aspect-video items-center justify-center">
					<ChefHat class="h-24 w-24 text-muted-foreground" />
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Default Notes -->
	{#if data.meal.defaultNotes}
		<Card>
			<CardHeader>
				<CardTitle>Default Notes</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-muted-foreground whitespace-pre-wrap">{data.meal.defaultNotes}</p>
			</CardContent>
		</Card>
	{/if}

	<!-- Actions -->
	<div class="flex gap-2">
		<Button size="lg" onclick={cookToday}>
			Cooked Today
		</Button>
		<Button variant="outline" size="lg" onclick={() => goto(`/entries/add?mealId=${data.meal.id}`)}>
			Add Entry
		</Button>
	</div>
</div>

