<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		BookOpen,
		Calendar as CalendarIcon,
		CalendarDays,
		ChefHat,
		ChevronLeft,
		ChevronRight,
		List,
		Loader2,
		Plus,
		Search,
		TrendingUp,
		UtensilsCrossed,
		X
	} from '@lucide/svelte';
	import {
		addDays,
		formatDate,
		getMonthYear,
		getWeekStart,
		isSameDay,
		isToday,
		toDateString
	} from '$lib/utils/date';
	import QuickAddEntryDialog from '$lib/components/quick-add-entry-dialog.svelte';
	import MealEntryCard from '$lib/components/meal-entry-card.svelte';
	import RandomMealSuggestion from '$lib/components/random-meal-suggestion.svelte';
	import FloatingActionButton from '$lib/components/floating-action-button.svelte';
	import * as m from '$lib/paraglide/messages.js';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	const view = $derived(data.view || 'week');
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
			highlightedMealIndex =
				highlightedMealIndex < filteredMeals.length - 1 ? highlightedMealIndex + 1 : 0;
			showMealSuggestions = true;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightedMealIndex =
				highlightedMealIndex > 0 ? highlightedMealIndex - 1 : filteredMeals.length - 1;
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
		selectedDate ? entriesWithDates.filter((e) => isSameDay(e.dateCooked, selectedDate)) : []
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

	function setView(newView: string) {
		goto(`/?view=${newView}`, { noScroll: true });
	}

	// Parsed as local midnight so weekday and day number match what the user sees
	const weekStart = $derived(new Date(`${data.weekStart}T00:00:00`));
	const weekDays = $derived(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)));
	const isCurrentWeek = $derived(isSameDay(weekStart, getWeekStart(new Date())));
	const weekRangeLabel = $derived(
		`${formatDate(weekDays[0], { day: 'numeric', month: 'short' })} – ${formatDate(weekDays[6], { day: 'numeric', month: 'short', year: 'numeric' })}`
	);

	let selectedWeekDay = $state<string | null>(null);

	$effect(() => {
		// A different week was loaded: drop the day filter
		void data.weekStart;
		selectedWeekDay = null;
	});

	const weekEntriesByDay = $derived.by(() => {
		const grouped = new Map<string, typeof data.weekEntries>();
		for (const entry of data.weekEntries) {
			// dateCooked is a date-only column delivered as UTC midnight
			const day = new Date(entry.dateCooked).toISOString().slice(0, 10);
			grouped.set(day, [...(grouped.get(day) ?? []), entry]);
		}
		return grouped;
	});

	const visibleWeekDays = $derived(
		weekDays.filter((day) => {
			const key = toDateString(day)!;
			return selectedWeekDay ? key === selectedWeekDay : weekEntriesByDay.has(key);
		})
	);

	function changeWeek(offset: number) {
		const target = offset === 0 ? getWeekStart(new Date()) : addDays(weekStart, offset * 7);
		goto(`/?view=week&week=${toDateString(target)}`, { noScroll: true });
	}

	function toggleWeekDay(day: Date) {
		const key = toDateString(day)!;
		selectedWeekDay = selectedWeekDay === key ? null : key;
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
		return (
			date.getMonth() === currentMonth.getMonth() &&
			date.getFullYear() === currentMonth.getFullYear()
		);
	}

	function hasEntries(date: Date): boolean {
		const dateStr = toDateString(date);
		return dateStr ? data.datesWithEntries.includes(dateStr) : false;
	}

	const greeting = $derived.by(() => {
		const name = data.user.name.split(' ')[0];
		const hour = new Date().getHours();
		if (hour < 11) return m.diary_greetingMorning({ name });
		if (hour < 17) return m.diary_greetingAfternoon({ name });
		return m.diary_greetingEvening({ name });
	});

	const statTiles = $derived([
		{
			label: m.diary_statEntries(),
			value: data.stats.totalEntries,
			icon: BookOpen,
			tint: 'bg-primary/15 text-primary'
		},
		{
			label: m.diary_statMeals(),
			value: data.stats.totalMeals,
			icon: UtensilsCrossed,
			tint: 'bg-accent/15 text-accent'
		},
		{
			label: m.diary_statPerWeek(),
			value: data.stats.averageEntriesPerWeek,
			icon: TrendingUp,
			tint: 'bg-chart-2/15 text-chart-2'
		}
	]);

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

<div class="mx-auto max-w-5xl space-y-8 px-4 pt-6 md:px-8 md:pt-2" in:fade={{ duration: 250 }}>
	<header class="flex items-end justify-between gap-4">
		<div class="min-w-0">
			<p class="text-sm font-medium text-muted-foreground">{greeting}</p>
			<h1 class="mt-1 text-3xl font-extrabold md:text-4xl">{m.diary_title()}</h1>
		</div>
		<div class="flex shrink-0 rounded-full bg-secondary p-1" role="tablist">
			{#each [{ id: 'week', icon: CalendarDays, label: m.diary_week() }, { id: 'calendar', icon: CalendarIcon, label: m.diary_month() }, { id: 'timeline', icon: List, label: m.diary_timeline() }] as option (option.id)}
				<button
					role="tab"
					aria-selected={view === option.id}
					aria-label={option.label}
					onclick={() => view !== option.id && setView(option.id)}
					class={[
						'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all',
						view === option.id
							? 'bg-card text-foreground shadow-soft'
							: 'text-muted-foreground hover:text-foreground'
					]}
				>
					<option.icon class="size-4" />
					<span class="hidden sm:inline">{option.label}</span>
				</button>
			{/each}
		</div>
	</header>

	<div class="relative">
		{#if data.searchedMeal}
			<div
				class="flex h-13 w-full items-center gap-3 rounded-full border bg-card pr-2 pl-2 shadow-soft"
			>
				{#if data.searchedMeal.defaultPhotoUrl}
					<img
						src={data.searchedMeal.defaultPhotoUrl}
						alt=""
						class="size-9 rounded-full object-cover"
					/>
				{:else}
					<div class="flex size-9 items-center justify-center rounded-full bg-primary/15">
						<ChefHat class="size-4 text-primary" />
					</div>
				{/if}
				<span class="flex-1 truncate font-semibold">{data.searchedMeal.title}</span>
				<button
					type="button"
					onclick={clearMealSearch}
					class="rounded-full p-2 hover:bg-secondary"
					aria-label={m.common_clear()}
				>
					<X class="size-4" />
				</button>
			</div>
		{:else}
			<label
				class="flex h-13 w-full items-center gap-3 rounded-full border bg-card px-5 shadow-soft transition-shadow focus-within:ring-[3px] focus-within:ring-ring/40"
			>
				<Search class="size-5 shrink-0 text-muted-foreground" />
				<input
					bind:this={mealInputRef}
					bind:value={mealSearchQuery}
					onkeydown={handleMealSearchKeydown}
					onfocus={() => (showMealSuggestions = true)}
					onblur={() =>
						setTimeout(() => {
							showMealSuggestions = false;
							highlightedMealIndex = -1;
						}, 200)}
					oninput={() => {
						showMealSuggestions = true;
						highlightedMealIndex = -1;
					}}
					placeholder={m.diary_searchPlaceholder()}
					class="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
				/>
			</label>
		{/if}
		{#if showMealSuggestions && filteredMeals.length > 0 && !data.searchedMeal}
			<div
				class="absolute top-full right-0 left-0 z-50 mt-2 max-h-[320px] overflow-auto rounded-3xl border bg-popover p-2 shadow-lifted"
			>
				{#each filteredMeals as meal, index (meal.id)}
					<button
						type="button"
						class={[
							'flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors',
							highlightedMealIndex === index ? 'bg-secondary' : 'hover:bg-secondary'
						]}
						onclick={() => selectMealSearch(meal.id)}
						onmouseenter={() => (highlightedMealIndex = index)}
						onmousedown={(e) => e.preventDefault()}
					>
						{#if meal.defaultPhotoUrl}
							<img src={meal.defaultPhotoUrl} alt="" class="size-9 rounded-xl object-cover" />
						{:else}
							<div class="flex size-9 items-center justify-center rounded-xl bg-muted">
								<ChefHat class="size-4 text-muted-foreground" />
							</div>
						{/if}
						<span class="flex-1 font-medium">{meal.title}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if !data.searchedMeal}
		<section class="grid gap-3 md:grid-cols-5">
			<div class="md:col-span-3">
				<RandomMealSuggestion meals={data.suggestionMeals} />
			</div>
			<div class="grid grid-cols-3 gap-3 md:col-span-2 md:grid-cols-1">
				{#each statTiles as tile (tile.label)}
					<div
						class="flex flex-col justify-between gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft md:flex-row md:items-center"
					>
						<div class={['flex size-9 items-center justify-center rounded-2xl', tile.tint]}>
							<tile.icon class="size-4.5" />
						</div>
						<div class="md:text-right">
							<p class="text-2xl leading-none font-extrabold tabular-nums">{tile.value}</p>
							<p class="mt-1 text-xs font-medium text-muted-foreground">{tile.label}</p>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if data.searchedMeal && data.searchedMealEntries}
		<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
			<div class="mb-4 flex items-center justify-between gap-3">
				<h2 class="text-lg font-bold">{m.diary_entriesFor({ title: data.searchedMeal.title })}</h2>
				<span class="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
					{m.diary_times({ count: data.searchedMealEntries.length })}
				</span>
			</div>
			{#if data.searchedMealEntries.length > 0}
				<ol class="relative space-y-3 border-l-2 border-dashed border-primary/30 pl-5">
					{#each data.searchedMealEntries as entry (entry.id)}
						{@const entryDate =
							typeof entry.dateCooked === 'string' ? new Date(entry.dateCooked) : entry.dateCooked}
						<li class="relative">
							<span
								class="absolute top-1.5 -left-[27px] size-3 rounded-full bg-primary ring-4 ring-card"
							></span>
							<p class="font-semibold">
								{formatDate(entryDate)}
								{#if isToday(entryDate)}
									<span
										class="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground"
										>{m.common_today()}</span
									>
								{/if}
							</p>
							{#if entry.notes}
								<p class="mt-0.5 text-sm text-muted-foreground">{entry.notes}</p>
							{/if}
						</li>
					{/each}
				</ol>
			{:else}
				<p class="text-muted-foreground">{m.diary_notCookedYet()}</p>
			{/if}
		</section>
	{/if}

	{#if !data.searchedMeal}
		{#if view === 'week'}
			<section class="space-y-5">
				<div class="rounded-3xl border border-border/60 bg-card p-3 shadow-soft md:p-4">
					<div class="mb-3 flex items-center justify-between gap-2 px-1">
						<h2 class="text-base font-bold md:text-lg">{weekRangeLabel}</h2>
						<div class="flex items-center gap-1">
							{#if !isCurrentWeek}
								<button
									class="mr-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
									onclick={() => changeWeek(0)}
								>
									{m.common_today()}
								</button>
							{/if}
							<Button
								variant="ghost"
								size="icon-sm"
								onclick={() => changeWeek(-1)}
								aria-label={m.diary_previousWeek()}
							>
								<ChevronLeft />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								onclick={() => changeWeek(1)}
								aria-label={m.diary_nextWeek()}
							>
								<ChevronRight />
							</Button>
						</div>
					</div>
					<div class="grid grid-cols-7 gap-1.5">
						{#each weekDays as day (day.getTime())}
							{@const key = toDateString(day)!}
							{@const selected = selectedWeekDay === key}
							{@const hasEntry = weekEntriesByDay.has(key)}
							<button
								class={[
									'flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-colors',
									selected
										? 'bg-primary text-primary-foreground shadow-soft'
										: 'hover:bg-secondary',
									isToday(day) && !selected && 'ring-2 ring-primary ring-inset'
								]}
								aria-pressed={selected}
								onclick={() => toggleWeekDay(day)}
							>
								<span
									class={[
										'text-[11px] font-semibold uppercase',
										selected ? 'opacity-80' : 'text-muted-foreground'
									]}
								>
									{formatDate(day, { weekday: 'short' }).replace('.', '')}
								</span>
								<span class="text-lg leading-none font-extrabold tabular-nums">{day.getDate()}</span
								>
								<span
									class={[
										'size-1.5 rounded-full',
										hasEntry
											? selected
												? 'bg-primary-foreground'
												: 'bg-primary'
											: 'bg-transparent'
									]}
								></span>
							</button>
						{/each}
					</div>
				</div>

				{#if visibleWeekDays.length > 0}
					{#each visibleWeekDays as day (day.getTime())}
						{@const dayEntries = weekEntriesByDay.get(toDateString(day)!) ?? []}
						<section>
							<h2
								class="mb-3 flex items-center gap-3 text-sm font-bold tracking-wide text-muted-foreground uppercase"
							>
								{#if isToday(day)}
									<span class="rounded-full bg-primary px-2.5 py-0.5 text-primary-foreground"
										>{m.common_today()}</span
									>
								{:else}
									{formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}
								{/if}
								<span class="h-px flex-1 bg-border"></span>
							</h2>
							{#if dayEntries.length > 0}
								<div class="grid gap-3 md:grid-cols-2">
									{#each dayEntries as entry (entry.id)}
										<MealEntryCard {entry} meals={data.meals} />
									{/each}
								</div>
							{:else}
								<div
									class="flex items-center justify-between gap-4 rounded-3xl border-2 border-dashed px-5 py-4"
								>
									<p class="text-sm text-muted-foreground">{m.diary_noEntriesForDate()}</p>
									<Button size="sm" onclick={() => openAddEntry(day)}>
										<Plus />
										{m.diary_addEntry()}
									</Button>
								</div>
							{/if}
						</section>
					{/each}
				{:else}
					<div
						class="flex flex-col items-center rounded-3xl border-2 border-dashed px-6 py-10 text-center"
					>
						<div class="mb-3 flex size-14 items-center justify-center rounded-3xl bg-primary/15">
							<ChefHat class="size-7 text-primary" />
						</div>
						<p class="text-muted-foreground">{m.diary_noEntriesThisWeek()}</p>
						<Button
							class="mt-4"
							onclick={() => openAddEntry(isCurrentWeek ? new Date() : weekStart)}
						>
							<Plus />
							{m.diary_addEntry()}
						</Button>
					</div>
				{/if}
			</section>
		{:else if view === 'calendar'}
			<div class="grid gap-4 md:grid-cols-5">
				<section
					class="rounded-3xl border border-border/60 bg-card p-4 shadow-soft md:col-span-3 md:p-6"
				>
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-bold capitalize">{getMonthYear(currentMonth)}</h2>
						<div class="flex gap-1">
							<Button
								variant="ghost"
								size="icon"
								onclick={() => changeMonth('prev')}
								aria-label="Previous month"
							>
								<ChevronLeft />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onclick={() => changeMonth('next')}
								aria-label="Next month"
							>
								<ChevronRight />
							</Button>
						</div>
					</div>
					<div
						class="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground uppercase"
					>
						{#each [m.common_days_short_mo(), m.common_days_short_tu(), m.common_days_short_we(), m.common_days_short_th(), m.common_days_short_fr(), m.common_days_short_sa(), m.common_days_short_su()] as day (day)}
							<div class="py-2">{day}</div>
						{/each}
					</div>
					<div class="grid grid-cols-7 gap-1">
						{#each Array(42) as _, i (i)}
							{@const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)}
							{@const dayOffset =
								i - ((new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7)}
							{@const cellDate = new Date(date.getFullYear(), date.getMonth(), dayOffset + 1)}
							{@const isCurrentMonth = isDateInCurrentMonth(cellDate)}
							{@const isSelected = selectedDate && isSameDay(cellDate, selectedDate)}
							{@const hasEntry = hasEntries(cellDate)}
							<button
								class={[
									'relative flex aspect-square items-center justify-center rounded-2xl text-sm font-semibold transition-colors',
									isSelected
										? 'bg-primary text-primary-foreground shadow-soft'
										: hasEntry
											? 'bg-primary/12 text-foreground hover:bg-primary/20'
											: 'hover:bg-secondary',
									!isCurrentMonth && !isSelected && 'opacity-35',
									isToday(cellDate) && !isSelected && 'ring-2 ring-primary ring-inset'
								]}
								onclick={() => selectDate(cellDate)}
							>
								{cellDate.getDate()}
								{#if hasEntry}
									<span
										class={[
											'absolute bottom-1.5 size-1 rounded-full',
											isSelected ? 'bg-primary-foreground' : 'bg-primary'
										]}
									></span>
								{/if}
							</button>
						{/each}
					</div>
				</section>

				<section class="space-y-3 md:col-span-2">
					<h2 class="px-1 text-lg font-bold">
						{selectedDate ? formatDate(selectedDate) : m.diary_selectDate()}
					</h2>
					{#if selectedDate}
						{#if entriesForSelectedDate.length > 0}
							{#each entriesForSelectedDate as entry (entry.id)}
								<MealEntryCard {entry} meals={data.meals} />
							{/each}
						{:else}
							<div class="rounded-3xl border-2 border-dashed p-6 text-center">
								<p class="text-sm text-muted-foreground">{m.diary_noEntriesForDate()}</p>
								<Button class="mt-4" onclick={() => openAddEntry(selectedDate || undefined)}>
									<Plus />
									{m.diary_addEntry()}
								</Button>
							</div>
						{/if}
					{:else}
						<p class="px-1 text-sm text-muted-foreground">{m.diary_clickToViewEntries()}</p>
					{/if}
				</section>
			</div>
		{:else}
			<div class="space-y-8">
				{#if timelineEntriesByDate.length > 0}
					{#each timelineEntriesByDate as { date, entries } (date.getTime())}
						<section>
							<h2
								class="mb-3 flex items-center gap-3 text-sm font-bold tracking-wide text-muted-foreground uppercase"
							>
								{#if isToday(date)}
									<span class="rounded-full bg-primary px-2.5 py-0.5 text-primary-foreground"
										>{m.common_today()}</span
									>
								{:else}
									{formatDate(date)}
								{/if}
								<span class="h-px flex-1 bg-border"></span>
							</h2>
							<div class="grid gap-3 md:grid-cols-2">
								{#each entries as entry (entry.id)}
									<MealEntryCard {entry} meals={data.meals} />
								{/each}
							</div>
						</section>
					{/each}

					<div bind:this={loadMoreTrigger} class="flex justify-center py-4">
						{#if isLoadingMore}
							<div class="flex items-center gap-2 text-muted-foreground">
								<Loader2 class="size-5 animate-spin" />
								<span>{m.diary_loadingMore()}</span>
							</div>
						{:else if hasMore}
							<Button variant="outline" onclick={loadMoreEntries}>
								{m.diary_loadMore()}
							</Button>
						{:else}
							<p class="text-sm text-muted-foreground">{m.diary_reachedEnd()}</p>
						{/if}
					</div>
				{:else}
					<div
						class="flex flex-col items-center rounded-3xl border-2 border-dashed px-6 py-14 text-center"
					>
						<div class="mb-4 flex size-16 items-center justify-center rounded-3xl bg-primary/15">
							<ChefHat class="size-8 text-primary" />
						</div>
						<p class="max-w-xs text-muted-foreground">{m.diary_noEntriesYet()}</p>
						<Button class="mt-5" onclick={() => openAddEntry()}>
							<Plus />
							{m.diary_addEntry()}
						</Button>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<FloatingActionButton
	icon={Plus}
	label={m.diary_addEntry()}
	onclick={() => openAddEntry()}
	class="hidden md:flex"
/>

<QuickAddEntryDialog meals={data.meals} bind:open={showQuickAddDialog} />
