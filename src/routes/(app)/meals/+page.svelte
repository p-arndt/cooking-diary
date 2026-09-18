<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import MealCard from '$lib/components/meal-card.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import { Check, ChefHat, Plus, Search, SlidersHorizontal, Tags, X } from '@lucide/svelte';
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

	let hasActiveFilters = $derived(searchQuery || selectedCategoryIds.length > 0);
</script>

<svelte:head>
	<title>{m.meals_pageTitle()}</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6 px-4 pt-6 md:px-8 md:pt-2">
	<PageHeader title={m.meals_title()} subtitle={m.meals_subtitle()}>
		{#snippet actions()}
			<a
				href="/categories"
				class="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70 md:hidden"
			>
				<Tags class="size-4" />
				{m.nav_categories()}
			</a>
			<Button href="/meals/new" size="icon" class="md:hidden" aria-label={m.meals_addMeal()}>
				<Plus />
			</Button>
			<Button href="/meals/new" class="hidden md:inline-flex">
				<Plus />
				{m.meals_addMeal()}
			</Button>
		{/snippet}
	</PageHeader>

	<div class="space-y-3">
		<div class="flex gap-2">
			<label
				class="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border bg-card px-5 shadow-soft transition-shadow focus-within:ring-[3px] focus-within:ring-ring/40"
			>
				<Search class="size-5 shrink-0 text-muted-foreground" />
				<input
					type="text"
					placeholder={m.meals_searchPlaceholder()}
					bind:value={searchQuery}
					oninput={updateSearch}
					class="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
				/>
			</label>
			<Popover.Root bind:open>
				<Popover.Trigger
					class={[
						'relative flex size-12 shrink-0 items-center justify-center rounded-full border shadow-soft transition-colors sm:w-auto sm:gap-2 sm:px-5',
						selectedCategoryIds.length > 0
							? 'border-primary bg-primary text-primary-foreground'
							: 'bg-card hover:bg-secondary'
					]}
					aria-label={m.meals_allCategories()}
				>
					<SlidersHorizontal class="size-4.5" />
					<span class="hidden text-sm font-semibold sm:inline">
						{selectedCategoryIds.length === 0
							? m.meals_allCategories()
							: m.meals_categoriesSelected({ count: selectedCategoryIds.length })}
					</span>
					{#if selectedCategoryIds.length > 0}
						<span
							class="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background sm:hidden"
						>
							{selectedCategoryIds.length}
						</span>
					{/if}
				</Popover.Trigger>
				<Popover.Content
					class="w-[260px] rounded-3xl p-0"
					align="end"
					onOpenAutoFocus={(e) => e.preventDefault()}
					onCloseAutoFocus={(e) => e.preventDefault()}
					onInteractOutside={(e) => {
						if (e.target instanceof Element && e.target.closest('[data-slot="popover-trigger"]')) {
							e.preventDefault();
						}
					}}
				>
					<div class="flex items-center gap-2 border-b px-4 py-2">
						<Search class="size-4 shrink-0 opacity-50" />
						<input
							type="text"
							placeholder={m.categories_searchPlaceholder()}
							bind:value={filterSearch}
							class="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
						/>
					</div>
					<div class="max-h-[240px] overflow-y-auto p-2">
						{#if filteredCategories.length === 0}
							<div class="py-6 text-center text-sm text-muted-foreground">
								{m.categories_noCategoriesAvailable()}
							</div>
						{:else}
							{#each filteredCategories as category (category.id)}
								{@const selected = selectedCategoryIds.includes(category.id)}
								<button
									type="button"
									class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium outline-none hover:bg-secondary"
									onclick={() => toggleCategory(category.id)}
								>
									<span
										class={[
											'flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
											selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
										]}
									>
										{#if selected}
											<Check class="size-3" strokeWidth={3} />
										{/if}
									</span>
									<span class="truncate">{category.name}</span>
								</button>
							{/each}
						{/if}
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>

		{#if selectedCategories.length > 0 || hasActiveFilters}
			<div class="flex flex-wrap items-center gap-2">
				{#each selectedCategories as category (category.id)}
					<span class="inline-flex items-center gap-1 rounded-full bg-primary/15 py-1 pr-1 pl-3 text-sm font-semibold">
						{category.name}
						<button
							type="button"
							class="rounded-full p-0.5 transition-colors hover:bg-primary/25"
							onclick={() => removeCategory(category.id)}
							aria-label={m.common_clear()}
						>
							<X class="size-3.5" />
						</button>
					</span>
				{/each}
				{#if hasActiveFilters}
					<button
						type="button"
						onclick={clearFilters}
						class="rounded-full px-3 py-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
					>
						{m.common_clear()}
					</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if data.meals.length > 0}
		<div class="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
			{#each data.meals as meal (meal.id)}
				<MealCard {meal} />
			{/each}
		</div>
	{:else}
		<div class="flex flex-col items-center rounded-3xl border-2 border-dashed px-6 py-14 text-center">
			<div class="mb-4 flex size-16 items-center justify-center rounded-3xl bg-primary/15">
				<ChefHat class="size-8 text-primary" />
			</div>
			<p class="max-w-xs text-muted-foreground">
				{#if hasActiveFilters}
					{m.meals_noMealsFound()}
				{:else}
					{m.meals_noMealsYet()}
				{/if}
			</p>
			{#if !hasActiveFilters}
				<Button class="mt-5" href="/meals/new">
					<Plus />
					{m.meals_addMeal()}
				</Button>
			{/if}
		</div>
	{/if}
</div>
