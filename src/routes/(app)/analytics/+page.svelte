<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { TrendingUp, ChefHat, Calendar, Camera, FileText, BarChart3, Award, Clock } from '@lucide/svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { formatDate } from '$lib/utils/date';
	import * as m from '$lib/paraglide/messages.js';

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

	const maxMonthlyCount = $derived(
		data.monthlyStats.length > 0
			? Math.max(...data.monthlyStats.map((m) => m.count), 1)
			: 1
	);
</script>

<svelte:head>
	<title>{m.analytics_pageTitle()}</title>
</svelte:head>

<div class="container mx-auto max-w-6xl space-y-6 px-4 py-8">
	<div>
		<h1 class="text-4xl font-bold tracking-tight">{m.analytics_title()}</h1>
		<p class="mt-1 text-muted-foreground">{m.analytics_subtitle()}</p>
	</div>

	{#if data.generalStats.totalEntries > 0}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardContent class="pt-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">{m.analytics_totalEntries()}</p>
							<p class="text-2xl font-bold">{data.generalStats.totalEntries}</p>
						</div>
						<BarChart3 class="h-8 w-8 text-muted-foreground" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">{m.analytics_totalMeals()}</p>
							<p class="text-2xl font-bold">{data.generalStats.totalMeals}</p>
						</div>
						<ChefHat class="h-8 w-8 text-muted-foreground" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">{m.analytics_avgPerWeek()}</p>
							<p class="text-2xl font-bold">{data.generalStats.averageEntriesPerWeek}</p>
						</div>
						<Clock class="h-8 w-8 text-muted-foreground" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-muted-foreground">{m.analytics_totalCategories()}</p>
							<p class="text-2xl font-bold">{data.generalStats.totalCategories}</p>
						</div>
						<Calendar class="h-8 w-8 text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Award class="h-5 w-5 text-amber-500" />
						{m.analytics_topMeals()}
					</CardTitle>
					<CardDescription>{m.analytics_topMealsDescription()}</CardDescription>
				</CardHeader>
				<CardContent>
					{#if data.topMeals.length > 0}
						<div class="space-y-3">
							{#each data.topMeals as meal, index}
								<button
									type="button"
									onclick={() => goto(`/meals/${meal.mealId}`)}
									class="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent"
								>
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
										>
											{index + 1}
										</div>
										<span class="font-medium">{meal.mealTitle}</span>
									</div>
									<Badge variant="secondary">{m.analytics_times({ count: meal.count })}</Badge>
								</button>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">{m.analytics_noData()}</p>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<BarChart3 class="h-5 w-5 text-blue-500" />
						{m.analytics_categoryUsage()}
					</CardTitle>
					<CardDescription>{m.analytics_categoryUsageDescription()}</CardDescription>
				</CardHeader>
				<CardContent>
					{#if data.categoryStats.length > 0}
						<div class="space-y-3">
							{#each data.categoryStats.slice(0, 10) as stat}
								<div class="flex items-center justify-between rounded-lg border p-3">
									<div class="flex-1">
										<p class="font-medium">{stat.categoryName}</p>
										<p class="text-sm text-muted-foreground">
											{m.analytics_mealsInCategory({ count: stat.mealCount })}
										</p>
									</div>
									<Badge variant="secondary">{m.analytics_times({ count: stat.entryCount })}</Badge>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">{m.analytics_noData()}</p>
					{/if}
				</CardContent>
			</Card>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Camera class="h-5 w-5 text-purple-500" />
						{m.analytics_photoStats()}
					</CardTitle>
					<CardDescription>{m.analytics_photoStatsDescription()}</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						<div>
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-medium">{m.analytics_entriesWithPhotos()}</span>
								<span class="text-sm font-semibold">{photoPercentage}%</span>
							</div>
							<div class="h-2 w-full rounded-full bg-muted">
								<div
									class="h-2 rounded-full bg-primary transition-all"
									style="width: {photoPercentage}%"
								></div>
							</div>
							<p class="mt-1 text-xs text-muted-foreground">
								{data.generalStats.entriesWithPhotos} {m.analytics_of()} {data.generalStats.totalEntries} {m.analytics_entries()}
							</p>
						</div>
						<div>
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-medium">{m.analytics_entriesWithNotes()}</span>
								<span class="text-sm font-semibold">{notesPercentage}%</span>
							</div>
							<div class="h-2 w-full rounded-full bg-muted">
								<div
									class="h-2 rounded-full bg-primary transition-all"
									style="width: {notesPercentage}%"
								></div>
							</div>
							<p class="mt-1 text-xs text-muted-foreground">
								{data.generalStats.entriesWithNotes} {m.analytics_of()} {data.generalStats.totalEntries} {m.analytics_entries()}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Calendar class="h-5 w-5 text-green-500" />
						{m.analytics_timeframe()}
					</CardTitle>
					<CardDescription>{m.analytics_timeframeDescription()}</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#if data.generalStats.firstEntryDate}
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">{m.analytics_firstEntry()}</span>
								<span class="text-sm text-muted-foreground">
									{formatDate(data.generalStats.firstEntryDate)}
								</span>
							</div>
						{/if}
						{#if data.generalStats.lastEntryDate}
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">{m.analytics_lastEntry()}</span>
								<span class="text-sm text-muted-foreground">
									{formatDate(data.generalStats.lastEntryDate)}
								</span>
							</div>
						{/if}
						{#if data.generalStats.mostActiveDay}
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">{m.analytics_mostActiveDay()}</span>
								<Badge variant="secondary">{data.generalStats.mostActiveDay}</Badge>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>

		{#if data.monthlyStats.length > 0}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<BarChart3 class="h-5 w-5 text-indigo-500" />
						{m.analytics_monthlyActivity()}
					</CardTitle>
					<CardDescription>{m.analytics_monthlyActivityDescription()}</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each data.monthlyStats as month}
							<div>
								<div class="flex items-center justify-between mb-1">
									<span class="text-sm font-medium">
										{month.monthName} {month.year}
									</span>
									<span class="text-sm font-semibold">{month.count} {m.analytics_entries()}</span>
								</div>
								<div class="h-2 w-full rounded-full bg-muted">
									<div
										class="h-2 rounded-full bg-primary transition-all"
										style="width: {Math.round((month.count / maxMonthlyCount) * 100)}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}
	{/if}

	{#if data.patternsSummary.totalEntriesAnalyzed > 0}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<TrendingUp class="h-5 w-5 text-blue-500" />
					{m.analytics_cookingPatterns()}
				</CardTitle>
				<CardDescription>
					{m.analytics_basedOnEntries({ count: data.patternsSummary.totalEntriesAnalyzed })}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each DAY_NAMES as day}
						{@const patterns = data.patternsSummary.topCategoriesByDay[day] || []}
						<div
							class="rounded-lg border p-3 {day === TODAY_NAME
								? 'border-primary bg-primary/5'
								: ''}"
						>
							<div class="mb-2 flex items-center gap-2">
								<span class="font-medium">{day}</span>
								{#if day === TODAY_NAME}
									<Badge variant="default" class="text-xs">{m.common_today()}</Badge>
								{/if}
							</div>
							{#if patterns.length > 0}
								<div class="flex flex-wrap gap-1">
									{#each patterns as pattern}
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Badge variant="secondary" class="text-xs">
													{pattern.categoryName}
												</Badge>
											</Tooltip.Trigger>
											<Tooltip.Content>
												{m.analytics_cookedTimesOnDay({ count: pattern.count, day })}
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
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent class="py-12">
				<div class="text-center">
					<TrendingUp class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
					<p class="text-muted-foreground">{m.analytics_noPatternYet()}</p>
					<p class="text-sm text-muted-foreground mt-2">{m.analytics_needMoreEntries()}</p>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

