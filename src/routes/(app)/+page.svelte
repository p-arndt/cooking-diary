<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Plus, Calendar as CalendarIcon, List, Search, X, ChefHat, Loader2 } from '@lucide/svelte';
	import { getMonthYear, formatDate, isSameDay, toDateString, isToday } from '$lib/utils/date';
	import QuickAddEntryDialog from '$lib/components/quick-add-entry-dialog.svelte';
	import MealEntryCard from '$lib/components/meal-entry-card.svelte';
	import RandomMealSuggestion from '$lib/components/random-meal-suggestion.svelte';
	import * as m from '$lib/paraglide/messages.js';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	const view = $derived(data.view || 'timeline');
	const currentMonth = $derived(new Date(data.currentMonth || new Date()));
	let selectedDate = $state<Date | null>(new Date());

	let allTimelineEntries = $state([...data.timelineEntries]);
	let hasMore = $state(data.hasMoreEntries);
	let isLoadingMore = $state(false);
	let loadMoreTrigger = $state<HTMLDivElement | null>(null);

	$effect(() => {
		allTimelineEntries = [...data.timelineEntries];
		hasMore = data.hasMoreEntries;
	});

	async function loadMoreEntries() {
		if (isLoadingMore || !hasMore) return;

		isLoadingMore = true;
		try {
			const response = await fetch(`/api/entries?offset=${allTimelineEntries.length}&limit=15`);
			const result = await response.json();
			
			allTimelineEntries = [...allTimelineEntries, ...result.entries];
			hasMore = result.hasMore;
		} catch (error) {
			console.error('Failed to load more entries:', error);
		} finally {
			isLoadingMore = false;
		}
	}

	$effect(() => {
		if (!loadMoreTrigger || view !== 'timeline') return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
					loadMoreEntries();
				}
			},
			{ rootMargin: '100px' }
		);

		observer.observe(loadMoreTrigger);

		return () => observer.disconnect();
	});

	let mealSearchQuery = $state('');
	let showMealSuggestions = $state(false);
	let highlightedMealIndex = $state(-1);
	let mealInputRef = $state<HTMLInputElement | null>(null);

	const filteredMeals = $derived.by(() => {
		if (!mealSearchQuery.trim()) {
			return data.meals.slice(0, 8);
		}
		const query = mealSearchQuery.toLowerCase();
		return data.meals.filter((meal) => meal.title.toLowerCase().includes(query));
	});

	function selectMealSearch(mealId: string) {
		mealSearchQuery = '';
		showMealSuggestions = false;
		highlightedMealIndex = -1;
		goto(`/?meal=${mealId}`, { noScroll: true });
	}

	function clearMealSearch() {
		mealSearchQuery = '';
		showMealSuggestions = false;
		goto('/', { noScroll: true });
	}

	function handleMealSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (highlightedMealIndex >= 0 && highlightedMealIndex < filteredMeals.length) {
				selectMealSearch(filteredMeals[highlightedMealIndex].id);
			} else if (filteredMeals.length > 0) {
				selectMealSearch(filteredMeals[0].id);
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightedMealIndex = highlightedMealIndex < filteredMeals.length - 1 ? highlightedMealIndex + 1 : 0;
			showMealSuggestions = true;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightedMealIndex = highlightedMealIndex > 0 ? highlightedMealIndex - 1 : filteredMeals.length - 1;
			showMealSuggestions = true;
		} else if (e.key === 'Escape') {
			showMealSuggestions = false;
			highlightedMealIndex = -1;
		} else {
			highlightedMealIndex = -1;
			showMealSuggestions = true;
		}
	}
	
	const entriesWithDates = $derived(
		data.entries.map((e) => ({
			...e,
			dateCooked: typeof e.dateCooked === 'string' ? new Date(e.dateCooked) : e.dateCooked
		}))
	);
	
	const entriesForSelectedDate = $derived(
		selectedDate
			? entriesWithDates.filter((e) => isSameDay(e.dateCooked, selectedDate))
			: []
	);

	const timelineEntriesWithDates = $derived(
		allTimelineEntries.map((e) => ({
			...e,
			dateCooked: typeof e.dateCooked === 'string' ? new Date(e.dateCooked) : e.dateCooked
		}))
	);

	const timelineEntriesByDate = $derived.by(() => {
		const grouped = new Map<string, typeof timelineEntriesWithDates>();
		for (const entry of timelineEntriesWithDates) {
			const dateStr = toDateString(entry.dateCooked) || '';
			if (!grouped.has(dateStr)) {
				grouped.set(dateStr, []);
			}
			grouped.get(dateStr)!.push(entry);
		}
		return Array.from(grouped.entries())
			.map(([dateStr, entries]) => ({
				date: new Date(dateStr),
				entries
			}))
			.sort((a, b) => b.date.getTime() - a.date.getTime());
	});

	function toggleView() {
		const newView = view === 'calendar' ? 'timeline' : 'calendar';
		goto(`/?view=${newView}`, { noScroll: true });
	}

	function changeMonth(direction: 'prev' | 'next') {
		const newMonth = new Date(currentMonth);
		newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
		goto(`/?view=${view}&month=${newMonth.toISOString()}`, { noScroll: true });
	}

	function selectDate(date: Date) {
		selectedDate = date;
	}

	function isDateInCurrentMonth(date: Date): boolean {
		return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
	}

	function hasEntries(date: Date): boolean {
		const dateStr = toDateString(date);
		return dateStr ? data.datesWithEntries.includes(dateStr) : false;
	}

	let showQuickAddDialog = $state(false);

	function openAddEntry(date?: Date) {
		if (date) {
			const dateParam = `?date=${toDateString(date)}`;
			goto(`/entries/add${dateParam}`);
		} else {
			showQuickAddDialog = true;
		}
	}
</script>

<svelte:head>
	<title>{m.diary_pageTitle()}</title>
</svelte:head>

<div class="container mx-auto space-y-6 px-4 py-8" in:fade={{ duration: 300 }}>
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-4xl font-bold tracking-tight">{m.diary_title()}</h1>
				<p class="text-muted-foreground mt-1">
					{#if data.searchedMeal}
						{m.diary_entriesFor({ title: data.searchedMeal.title })}
					{:else if view === 'calendar'}
						{getMonthYear(currentMonth)}
					{:else}
						{m.diary_yourTimeline()}
					{/if}
				</p>
			</div>
			<Button variant="outline" onclick={toggleView} size="sm">
				{#if view === 'calendar'}
					<List class="mr-2 h-4 w-4" />
					{m.diary_timeline()}
				{:else}
					<CalendarIcon class="mr-2 h-4 w-4" />
					{m.diary_calendar()}
				{/if}
			</Button>
		</div>

		<div class="relative">
			{#if data.searchedMeal}
				<div class="flex w-full items-center gap-3 rounded-lg border bg-background px-4 py-3">
					{#if data.searchedMeal.defaultPhotoUrl}
						<img src={data.searchedMeal.defaultPhotoUrl} alt="" class="h-8 w-8 rounded object-cover" />
					{:else}
						<ChefHat class="h-6 w-6 text-muted-foreground" />
					{/if}
					<span class="flex-1 font-medium">{data.searchedMeal.title}</span>
					<button type="button" onclick={clearMealSearch} class="rounded p-1 hover:bg-muted">
						<X class="h-4 w-4" />
					</button>
				</div>
			{:else}
				<div class="flex w-full items-center rounded-lg border bg-background px-4 py-3">
					<Search class="mr-3 h-5 w-5 text-muted-foreground" />
					<input
						bind:this={mealInputRef}
						bind:value={mealSearchQuery}
						onkeydown={handleMealSearchKeydown}
						onfocus={() => (showMealSuggestions = true)}
						onblur={() => setTimeout(() => { showMealSuggestions = false; highlightedMealIndex = -1; }, 200)}
						oninput={() => { showMealSuggestions = true; highlightedMealIndex = -1; }}
						placeholder={m.diary_searchPlaceholder()}
						class="w-full bg-transparent outline-none placeholder:text-muted-foreground"
					/>
				</div>
			{/if}
			{#if showMealSuggestions && filteredMeals.length > 0 && !data.searchedMeal}
				<div class="absolute left-0 right-0 top-full z-50 mt-2 max-h-[300px] overflow-auto rounded-lg border bg-popover shadow-lg">
					<div class="p-1">
						{#each filteredMeals as meal, index}
							<button
								type="button"
								class="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-accent {highlightedMealIndex === index ? 'bg-accent' : ''}"
								onclick={() => selectMealSearch(meal.id)}
								onmouseenter={() => (highlightedMealIndex = index)}
								onmousedown={(e) => e.preventDefault()}
							>
								<div class="flex items-center gap-3">
									{#if meal.defaultPhotoUrl}
										<img src={meal.defaultPhotoUrl} alt="" class="h-8 w-8 rounded object-cover" />
									{:else}
										<div class="flex h-8 w-8 items-center justify-center rounded bg-muted">
											<ChefHat class="h-4 w-4 text-muted-foreground" />
										</div>
									{/if}
									<span class="flex-1">{meal.title}</span>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		{#if data.suggestionMeals.length > 0 && !data.searchedMeal}
			<RandomMealSuggestion meals={data.suggestionMeals} />
		{/if}
	</div>

	{#if data.searchedMeal && data.searchedMealEntries}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					{#if data.searchedMeal.defaultPhotoUrl}
						<img src={data.searchedMeal.defaultPhotoUrl} alt="" class="h-8 w-8 rounded object-cover" />
					{/if}
					{data.searchedMeal.title}
					<Badge variant="secondary" class="ml-2">{m.diary_times({ count: data.searchedMealEntries.length })}</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{#if data.searchedMealEntries.length > 0}
					<div class="space-y-2">
						{#each data.searchedMealEntries as entry}
							{@const entryDate = typeof entry.dateCooked === 'string' ? new Date(entry.dateCooked) : entry.dateCooked}
							<div class="flex items-center justify-between rounded-md border p-3">
								<div class="flex items-center gap-3">
									<CalendarIcon class="h-4 w-4 text-muted-foreground" />
									<span class="font-medium">{formatDate(entryDate)}</span>
									{#if isToday(entryDate)}
										<Badge>{m.common_today()}</Badge>
									{/if}
								</div>
								{#if entry.notes}
									<p class="text-sm text-muted-foreground truncate max-w-[200px]">{entry.notes}</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground">{m.diary_notCookedYet()}</p>
				{/if}
			</CardContent>
		</Card>
	{/if}

	{#if !data.searchedMeal}
		{#if view === 'calendar'}
		<div class="grid gap-6 md:grid-cols-3">
			<Card class="md:col-span-2">
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle>{getMonthYear(currentMonth)}</CardTitle>
						<div class="flex gap-2">
							<Button variant="ghost" size="icon" onclick={() => changeMonth('prev')}>
								←
							</Button>
							<Button variant="ghost" size="icon" onclick={() => changeMonth('next')}>
								→
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-7 gap-1 text-center text-sm font-medium">
						<div class="p-2">{m.common_days_short_mo()}</div>
						<div class="p-2">{m.common_days_short_tu()}</div>
						<div class="p-2">{m.common_days_short_we()}</div>
						<div class="p-2">{m.common_days_short_th()}</div>
						<div class="p-2">{m.common_days_short_fr()}</div>
						<div class="p-2">{m.common_days_short_sa()}</div>
						<div class="p-2">{m.common_days_short_su()}</div>
					</div>
					<div class="grid grid-cols-7 gap-1">
						{#each Array(42) as _, i}
							{@const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)}
							{@const dayOffset = i - (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7}
							{@const cellDate = new Date(date.getFullYear(), date.getMonth(), dayOffset + 1)}
							{@const isCurrentMonth = isDateInCurrentMonth(cellDate)}
							{@const isSelected = selectedDate && isSameDay(cellDate, selectedDate)}
							{@const hasEntry = hasEntries(cellDate)}
							<button
								class="relative aspect-square rounded-lg p-2 text-sm transition-colors hover:bg-accent {isCurrentMonth
									? 'text-foreground'
									: 'text-muted-foreground/50'} {isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''} {isToday(cellDate) && !isSelected
									? 'ring-2 ring-primary'
									: ''}"
								onclick={() => {
									selectDate(cellDate);
								}}
							>
								{cellDate.getDate()}
								{#if hasEntry}
									<span class="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full {isSelected ? 'bg-primary-foreground' : 'bg-primary'}"></span>
								{/if}
							</button>
						{/each}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						{#if selectedDate}
							{formatDate(selectedDate)}
						{:else}
							{m.diary_selectDate()}
						{/if}
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3">
					{#if selectedDate}
						{#if entriesForSelectedDate.length > 0}
							{#each entriesForSelectedDate as entry}
								<MealEntryCard {entry} meals={data.meals} />
							{/each}
						{:else}
							<p class="text-sm text-muted-foreground">{m.diary_noEntriesForDate()}</p>
							<Button class="mt-2 w-full" onclick={() => openAddEntry(selectedDate || undefined)}>
								<Plus class="mr-2 h-4 w-4" />
								{m.diary_addEntry()}
							</Button>
						{/if}
					{:else}
						<p class="text-sm text-muted-foreground">{m.diary_clickToViewEntries()}</p>
					{/if}
				</CardContent>
			</Card>
		</div>
	{:else}
		<div class="space-y-6">
			{#if timelineEntriesByDate.length > 0}
				{#each timelineEntriesByDate as { date, entries }}
					<div>
						<h2 class="mb-3 text-lg font-semibold">
							{#if isToday(date)}
								{m.common_today()}
							{:else}
								{formatDate(date)}
							{/if}
						</h2>
						<div class="space-y-3">
							{#each entries as entry}
								<MealEntryCard {entry} meals={data.meals} />
							{/each}
						</div>
					</div>
				{/each}

				<div bind:this={loadMoreTrigger} class="flex justify-center py-4">
					{#if isLoadingMore}
						<div class="flex items-center gap-2 text-muted-foreground">
							<Loader2 class="h-5 w-5 animate-spin" />
							<span>{m.diary_loadingMore()}</span>
						</div>
					{:else if hasMore}
						<Button variant="ghost" onclick={loadMoreEntries}>
							{m.diary_loadMore()}
						</Button>
					{:else}
						<p class="text-sm text-muted-foreground">{m.diary_reachedEnd()}</p>
					{/if}
				</div>
			{:else}
				<Card>
					<CardContent class="pt-6">
						<p class="text-center text-muted-foreground">{m.diary_noEntriesYet()}</p>
					</CardContent>
				</Card>
			{/if}
		</div>
		{/if}
	{/if}
</div>

<button
	class="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl"
	onclick={() => openAddEntry()}
	aria-label={m.diary_addEntry()}
>
	<Plus class="h-6 w-6" />
</button>

<QuickAddEntryDialog meals={data.meals} bind:open={showQuickAddDialog} />
