<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import PageHeader from '$lib/components/page-header.svelte';
	import {
		Award,
		BarChart3,
		BookOpen,
		Calendar,
		Camera,
		ChefHat,
		Tags,
		TrendingUp
	} from '@lucide/svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { formatDate } from '$lib/utils/date';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	let { data }: { data: PageData } = $props();

	const DAY_NAMES = [
		m.common_days_sunday(),
		m.common_days_monday(),
		m.common_days_tuesday(),
		m.common_days_wednesday(),
		m.common_days_thursday(),
		m.common_days_friday(),
		m.common_days_saturday()
	];
	const TODAY_NAME = DAY_NAMES[new Date().getDay()];
	const TODAY_DAY_OF_WEEK = new Date().getDay();

	function getDayName(dayOfWeek: number): string {
		return DAY_NAMES[dayOfWeek];
	}

	function getMonthName(month: number, year: number): string {
		const locale = getLocale() === 'de' ? 'de-DE' : 'en-US';
		const date = new Date(year, month - 1, 1);
		return date.toLocaleDateString(locale, { month: 'long' });
	}

	const currentLocale = $derived(getLocale() === 'de' ? 'de-DE' : 'en-US');

	const photoPercentage = $derived(
		data.generalStats.totalEntries > 0
			? Math.round((data.generalStats.entriesWithPhotos / data.generalStats.totalEntries) * 100)
			: 0
	);

	const notesPercentage = $derived(
		data.generalStats.totalEntries > 0
			? Math.round((data.generalStats.entriesWithNotes / data.generalStats.totalEntries) * 100)
			: 0
	);

	const statTiles = $derived([
		{ label: m.analytics_totalEntries(), value: data.generalStats.totalEntries, icon: BookOpen, tint: 'bg-primary/15 text-primary' },
		{ label: m.analytics_totalMeals(), value: data.generalStats.totalMeals, icon: ChefHat, tint: 'bg-accent/15 text-accent' },
		{ label: m.analytics_avgPerWeek(), value: data.generalStats.averageEntriesPerWeek, icon: TrendingUp, tint: 'bg-chart-2/15 text-chart-2' },
		{ label: m.analytics_totalCategories(), value: data.generalStats.totalCategories, icon: Tags, tint: 'bg-chart-4/15 text-chart-4' }
	]);

	const coverage = $derived([
		{ label: m.analytics_entriesWithPhotos(), percent: photoPercentage, count: data.generalStats.entriesWithPhotos, color: 'var(--primary)' },
		{ label: m.analytics_entriesWithNotes(), percent: notesPercentage, count: data.generalStats.entriesWithNotes, color: 'var(--chart-2)' }
	]);

	// The service returns newest first; the bar chart reads left (old) to right (new)
	const monthlyChronological = $derived([...data.monthlyStats].reverse());

	const maxMonthlyCount = $derived(
		data.monthlyStats.length > 0
			? Math.max(...data.monthlyStats.map((m) => m.count), 1)
			: 1
	);
</script>

<svelte:head>
	<title>{m.analytics_pageTitle()}</title>
</svelte:head>

{#snippet sectionTitle(icon: typeof Award, tint: string, title: string, description?: string)}
	{@const Icon = icon}
	<div class="mb-4 flex items-start gap-3">
		<span class={['flex size-9 shrink-0 items-center justify-center rounded-2xl', tint]}>
			<Icon class="size-4.5" />
		</span>
		<div class="min-w-0">
			<h2 class="font-bold">{title}</h2>
			{#if description}
				<p class="text-sm text-muted-foreground">{description}</p>
			{/if}
		</div>
	</div>
{/snippet}

<div class="mx-auto max-w-5xl space-y-6 px-4 pt-6 md:px-8 md:pt-2">
	<PageHeader title={m.analytics_title()} subtitle={m.analytics_subtitle()} />

	{#if data.generalStats.totalEntries > 0}
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each statTiles as tile (tile.label)}
				<div class="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
					<span class={['flex size-10 items-center justify-center rounded-2xl', tile.tint]}>
						<tile.icon class="size-5" />
					</span>
					<div>
						<p class="text-3xl leading-none font-extrabold tabular-nums">{tile.value}</p>
						<p class="mt-1.5 text-xs font-medium text-muted-foreground">{tile.label}</p>
					</div>
				</div>
			{/each}
		</div>

		{#if data.monthlyStats.length > 0}
			<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
				{@render sectionTitle(BarChart3, 'bg-primary/15 text-primary', m.analytics_monthlyActivity(), m.analytics_monthlyActivityDescription())}
				<div class="flex h-48 items-end gap-2 md:gap-3">
					{#each monthlyChronological as month (`${month.year}-${month.month}`)}
						<div class="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
							<span class="text-xs font-bold tabular-nums">{month.count}</span>
							<div
								class="w-full max-w-12 rounded-xl bg-gradient-to-t from-primary to-accent-variant transition-opacity group-hover:opacity-80"
								style="height: {Math.max(Math.round((month.count / maxMonthlyCount) * 100), 4)}%"
								title="{getMonthName(month.month, month.year)} {month.year}: {month.count} {m.analytics_entries()}"
							></div>
							<span class="w-full truncate text-center text-[11px] font-semibold text-muted-foreground capitalize">
								{getMonthName(month.month, month.year).slice(0, 3)}
							</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<div class="grid gap-4 md:grid-cols-2">
			<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
				{@render sectionTitle(Award, 'bg-primary/15 text-primary', m.analytics_topMeals(), m.analytics_topMealsDescription())}
				{#if data.topMeals.length > 0}
					<ol class="space-y-1">
						{#each data.topMeals as meal, index (meal.mealId)}
							<li>
								<button
									type="button"
									onclick={() => goto(`/meals/${meal.mealId}`)}
									class="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-secondary"
								>
									<span
										class={[
											'flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold',
											index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
										]}
									>
										{index + 1}
									</span>
									<span class="min-w-0 flex-1 truncate font-semibold">{meal.mealTitle}</span>
									<span class="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
										{m.analytics_times({ count: meal.count })}
									</span>
								</button>
							</li>
						{/each}
					</ol>
				{:else}
					<p class="text-sm text-muted-foreground">{m.analytics_noData()}</p>
				{/if}
			</section>

			<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
				{@render sectionTitle(Tags, 'bg-chart-4/15 text-chart-4', m.analytics_categoryUsage(), m.analytics_categoryUsageDescription())}
				{#if data.categoryStats.length > 0}
					{@const maxCategoryCount = Math.max(...data.categoryStats.map((c) => c.entryCount), 1)}
					<div class="space-y-3">
						{#each data.categoryStats.slice(0, 10) as stat (stat.categoryId)}
							<div>
								<div class="mb-1.5 flex items-baseline justify-between gap-2">
									<p class="truncate text-sm font-semibold">
										{stat.categoryName}
										<span class="font-medium text-muted-foreground">
											· {stat.mealCount === 1
												? m.categories_mealCount_one({ count: stat.mealCount })
												: m.categories_mealCount_other({ count: stat.mealCount })}
										</span>
									</p>
									<span class="shrink-0 text-xs font-bold">{m.analytics_times({ count: stat.entryCount })}</span>
								</div>
								<div class="h-2.5 w-full rounded-full bg-secondary">
									<div
										class="h-full rounded-full bg-chart-4"
										style="width: {Math.round((stat.entryCount / maxCategoryCount) * 100)}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">{m.analytics_noData()}</p>
				{/if}
			</section>

			<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
				{@render sectionTitle(Camera, 'bg-chart-5/15 text-chart-5', m.analytics_photoStats(), m.analytics_photoStatsDescription())}
				<div class="grid grid-cols-2 gap-3">
					{#each coverage as item (item.label)}
						<div class="flex flex-col items-center rounded-2xl bg-secondary/60 p-4 text-center">
							<div
								class="relative flex size-24 items-center justify-center rounded-full"
								style="background: conic-gradient({item.color} {item.percent * 3.6}deg, var(--muted) 0deg)"
							>
								<div class="flex size-[76px] items-center justify-center rounded-full bg-card">
									<span class="text-xl font-extrabold tabular-nums">{item.percent}%</span>
								</div>
							</div>
							<p class="mt-3 text-sm font-semibold">{item.label}</p>
							<p class="text-xs text-muted-foreground">
								{item.count} {m.analytics_of()} {data.generalStats.totalEntries} {m.analytics_entries()}
							</p>
						</div>
					{/each}
				</div>
			</section>

			<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
				{@render sectionTitle(Calendar, 'bg-chart-2/15 text-chart-2', m.analytics_timeframe(), m.analytics_timeframeDescription())}
				<dl class="divide-y divide-border/60">
					{#if data.generalStats.firstEntryDate}
						<div class="flex items-center justify-between py-3">
							<dt class="text-sm font-medium">{m.analytics_firstEntry()}</dt>
							<dd class="text-sm font-semibold">
								{formatDate(data.generalStats.firstEntryDate, undefined, currentLocale)}
							</dd>
						</div>
					{/if}
					{#if data.generalStats.lastEntryDate}
						<div class="flex items-center justify-between py-3">
							<dt class="text-sm font-medium">{m.analytics_lastEntry()}</dt>
							<dd class="text-sm font-semibold">
								{formatDate(data.generalStats.lastEntryDate, undefined, currentLocale)}
							</dd>
						</div>
					{/if}
					{#if data.generalStats.mostActiveDay !== null}
						<div class="flex items-center justify-between py-3">
							<dt class="text-sm font-medium">{m.analytics_mostActiveDay()}</dt>
							<dd class="rounded-full bg-primary/15 px-3 py-0.5 text-sm font-semibold">
								{getDayName(data.generalStats.mostActiveDay)}
							</dd>
						</div>
					{/if}
				</dl>
			</section>
		</div>
	{/if}

	{#if data.patternsSummary.totalEntriesAnalyzed > 0}
		<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
			{@render sectionTitle(TrendingUp, 'bg-accent/15 text-accent', m.analytics_cookingPatterns(), m.analytics_basedOnEntries({ count: data.patternsSummary.totalEntriesAnalyzed }))}
			<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each DAY_NAMES as dayName, dayOfWeek (dayName)}
					{@const patterns = data.patternsSummary.topCategoriesByDay[dayOfWeek] || []}
					<div
						class={[
							'rounded-2xl p-3',
							dayOfWeek === TODAY_DAY_OF_WEEK ? 'bg-primary/12 ring-2 ring-primary/50' : 'bg-secondary/60'
						]}
					>
						<div class="mb-2 flex items-center gap-2">
							<span class="text-sm font-bold">{dayName}</span>
							{#if dayOfWeek === TODAY_DAY_OF_WEEK}
								<span class="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
									{m.common_today()}
								</span>
							{/if}
						</div>
						{#if patterns.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each patterns as pattern, patternIndex (patternIndex)}
									<Tooltip.Root>
										<Tooltip.Trigger>
											<span class="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold shadow-soft">
												{pattern.categoryName}
											</span>
										</Tooltip.Trigger>
										<Tooltip.Content>
											{m.analytics_cookedTimesOnDay({ count: pattern.count, day: dayName })}
										</Tooltip.Content>
									</Tooltip.Root>
								{/each}
							</div>
						{:else}
							<p class="text-xs text-muted-foreground">{m.analytics_noPatternYet()}</p>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{:else}
		<div class="flex flex-col items-center rounded-3xl border-2 border-dashed px-6 py-14 text-center">
			<div class="mb-4 flex size-16 items-center justify-center rounded-3xl bg-primary/15">
				<TrendingUp class="size-8 text-primary" />
			</div>
			<p class="text-muted-foreground">{m.analytics_noPatternYet()}</p>
			<p class="mt-1 max-w-xs text-sm text-muted-foreground">{m.analytics_needMoreEntries()}</p>
		</div>
	{/if}
</div>
