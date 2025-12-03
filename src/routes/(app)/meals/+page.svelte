<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { NativeSelect } from '$lib/components/ui/native-select/index.js';
	import MealEntryCard from '$lib/components/meal-entry-card.svelte';
	import { ChefHat, Plus, Search } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state(data.search || '');
	let selectedCategory = $state(data.categoryId || '');

	function updateSearch() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (selectedCategory) params.set('category', selectedCategory);
		goto(`/meals?${params.toString()}`, { noScroll: true, replaceState: true });
	}

	function clearFilters() {
		searchQuery = '';
		selectedCategory = '';
		goto('/meals', { noScroll: true, replaceState: true });
	}

	function openMeal(mealId: string) {
		goto(`/meals/${mealId}`);
	}
</script>

<svelte:head>
	<title>Meals - Cooking Diary</title>
</svelte:head>

<div class="container mx-auto space-y-6 px-4 py-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold tracking-tight">Meals</h1>
			<p class="text-muted-foreground mt-1">Your meal library</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-col gap-4 sm:flex-row">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search meals..."
				bind:value={searchQuery}
				oninput={updateSearch}
				class="pl-10"
			/>
		</div>
		<NativeSelect
			bind:value={selectedCategory}
			onchange={updateSearch}
			class="w-full sm:w-[200px]"
		>
			<option value="">All Categories</option>
			{#each data.categories as category}
				<option value={category.id}>{category.name}</option>
			{/each}
		</NativeSelect>
		{#if searchQuery || selectedCategory}
			<Button variant="outline" onclick={clearFilters}>Clear</Button>
		{/if}
	</div>

	<!-- Meals Grid -->
	{#if data.meals.length > 0}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.meals as meal}
				<MealEntryCard {meal} onclick={() => openMeal(meal.id)} />
			{/each}
		</div>
	{:else}
		<Card>
			<CardContent class="pt-6">
				<div class="text-center py-12">
					<ChefHat class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
					<p class="text-muted-foreground mb-4">
						{#if searchQuery || selectedCategory}
							No meals found matching your filters
						{:else}
							No meals yet. Create your first meal!
						{/if}
					</p>
					{#if !searchQuery && !selectedCategory}
						<Button onclick={() => goto('/meals/new')}>
							<Plus class="mr-2 h-4 w-4" />
							Add Meal
						</Button>
					{/if}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

<!-- Floating Action Button -->
<button
	class="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl"
	onclick={() => goto('/meals/new')}
	aria-label="Add Meal"
>
	<Plus class="h-6 w-6" />
</button>

