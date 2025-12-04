<script lang="ts">
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import MealEntryCard from '$lib/components/meal-entry-card.svelte';
	import { Check, ChefHat, ChevronsUpDown, Plus, Search, X } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state(data.search || '');
	let selectedCategoryIds = $state<string[]>(data.categoryId ? [data.categoryId] : []);
	let open = $state(false);
	let filterSearch = $state('');

	let selectedCategories = $derived(
		data.categories.filter((c) => selectedCategoryIds.includes(c.id))
	);

	let filteredCategories = $derived(
		data.categories.filter((c) => c.name.toLowerCase().includes(filterSearch.toLowerCase()))
	);

	function updateSearch() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (selectedCategoryIds.length > 0) {
			selectedCategoryIds.forEach((id) => params.append('category', id));
		}
		goto(`/meals?${params.toString()}`, { noScroll: true, replaceState: true, keepFocus: true });
	}

	function toggleCategory(categoryId: string) {
		if (selectedCategoryIds.includes(categoryId)) {
			selectedCategoryIds = selectedCategoryIds.filter((id) => id !== categoryId);
		} else {
			selectedCategoryIds = [...selectedCategoryIds, categoryId];
		}
		updateSearch();
	}

	function removeCategory(categoryId: string) {
		selectedCategoryIds = selectedCategoryIds.filter((id) => id !== categoryId);
		updateSearch();
	}

	function clearFilters() {
		searchQuery = '';
		selectedCategoryIds = [];
		goto('/meals', { noScroll: true, replaceState: true });
	}

	function openMeal(mealId: string) {
		goto(`/meals/${mealId}`);
	}

	let hasActiveFilters = $derived(searchQuery || selectedCategoryIds.length > 0);
</script>

<svelte:head>
	<title>{m.meals_pageTitle()}</title>
</svelte:head>

<div class="container mx-auto space-y-6 px-4 py-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold tracking-tight">{m.meals_title()}</h1>
			<p class="mt-1 text-muted-foreground">{m.meals_subtitle()}</p>
		</div>
	</div>

	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-4 sm:flex-row">
			<div class="relative flex-1">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder={m.meals_searchPlaceholder()}
					bind:value={searchQuery}
					oninput={updateSearch}
					class="pl-10"
				/>
			</div>
			<Popover.Root bind:open>
				<Popover.Trigger>
					<Button variant="outline" class="w-full justify-between sm:w-[200px]">
						<span class={selectedCategoryIds.length === 0 ? 'text-muted-foreground' : ''}>
							{selectedCategoryIds.length === 0
								? m.meals_allCategories()
								: m.meals_categoriesSelected({ count: selectedCategoryIds.length })}
						</span>
						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</Popover.Trigger>
				<Popover.Content
					class="w-[250px] p-0"
					align="start"
					onOpenAutoFocus={(e) => e.preventDefault()}
					onCloseAutoFocus={(e) => e.preventDefault()}
					onInteractOutside={(e) => {
						if (e.target instanceof Element && e.target.closest('[data-slot="popover-trigger"]')) {
							e.preventDefault();
						}
					}}
				>
					<div class="flex items-center gap-2 border-b px-3 py-2">
						<Search class="h-4 w-4 shrink-0 opacity-50" />
						<input
							type="text"
							placeholder={m.categories_searchPlaceholder()}
							bind:value={filterSearch}
							class="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
						/>
					</div>
					<div class="max-h-[200px] overflow-y-auto p-1">
						{#if filteredCategories.length === 0}
							<div class="py-6 text-center text-sm text-muted-foreground">
								{m.categories_noCategoriesAvailable()}
							</div>
						{:else}
							{#each filteredCategories as category (category.id)}
								<button
									type="button"
									class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
									onclick={() => toggleCategory(category.id)}
								>
									<div
										class="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border {selectedCategoryIds.includes(
											category.id
										)
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-muted-foreground/30'}"
									>
										{#if selectedCategoryIds.includes(category.id)}
											<Check class="h-3 w-3" />
										{/if}
									</div>
									<span class="truncate">{category.name}</span>
								</button>
							{/each}
						{/if}
					</div>
				</Popover.Content>
			</Popover.Root>
			{#if hasActiveFilters}
				<Button variant="outline" onclick={clearFilters}>{m.common_clear()}</Button>
			{/if}
		</div>

		{#if selectedCategories.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each selectedCategories as category}
					<Badge variant="secondary" class="gap-1 pr-1">
						{category.name}
						<button
							type="button"
							class="ml-1 rounded-full p-0.5 transition-colors hover:bg-muted-foreground/20"
							onclick={() => removeCategory(category.id)}
						>
							<X class="h-3 w-3" />
						</button>
					</Badge>
				{/each}
			</div>
		{/if}
	</div>

	{#if data.meals.length > 0}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.meals as meal}
				<MealEntryCard {meal} onclick={() => openMeal(meal.id)} />
			{/each}
		</div>
	{:else}
		<Card>
			<CardContent class="pt-6">
				<div class="py-12 text-center">
					<ChefHat class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<p class="mb-4 text-muted-foreground">
						{#if hasActiveFilters}
							{m.meals_noMealsFound()}
						{:else}
							{m.meals_noMealsYet()}
						{/if}
					</p>
					{#if !hasActiveFilters}
						<Button onclick={() => goto('/meals/new')}>
							<Plus class="mr-2 h-4 w-4" />
							{m.meals_addMeal()}
						</Button>
					{/if}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

<button
	class="fixed right-8 bottom-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl"
	onclick={() => goto('/meals/new')}
	aria-label={m.meals_addMeal()}
>
	<Plus class="h-6 w-6" />
</button>
