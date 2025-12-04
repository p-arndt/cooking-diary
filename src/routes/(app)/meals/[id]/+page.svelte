<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ArrowLeft, Edit, ChefHat, Clock, Flame, Gauge } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data }: { data: PageData } = $props();

	const difficultyLabel = $derived(
		data.meal.difficulty === 'easy'
			? m.common_difficulty_easy()
			: data.meal.difficulty === 'medium'
				? m.common_difficulty_medium()
				: data.meal.difficulty === 'hard'
					? m.common_difficulty_hard()
					: null
	);

	const difficultyColor = $derived(
		data.meal.difficulty === 'easy'
			? 'text-green-600'
			: data.meal.difficulty === 'medium'
				? 'text-yellow-600'
				: data.meal.difficulty === 'hard'
					? 'text-red-600'
					: ''
	);

	async function cookToday() {
		const today = new Date().toISOString().split('T')[0];
		goto(`/entries/add?step=3&date=${today}&mealId=${data.meal.id}`);
	}
</script>

<svelte:head>
	<title>{data.meal.title} - {m.common_appName()}</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8">
	<Button variant="ghost" onclick={() => goto('/meals')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		{m.meals_backToMeals()}
	</Button>

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
			{m.meals_editMeal()}
		</Button>
	</div>

	{#if data.meal.defaultPhotoUrl}
		<div class="aspect-video w-full overflow-hidden rounded-xl border bg-muted">
			<img
				src={data.meal.defaultPhotoUrl}
				alt={data.meal.title}
				class="h-full w-full object-contain"
			/>
		</div>
	{:else}
		<div class="flex aspect-video w-full items-center justify-center rounded-xl border bg-muted">
			<ChefHat class="h-24 w-24 text-muted-foreground" />
		</div>
	{/if}

	{#if data.meal.prepTime || data.meal.cookTime || data.meal.difficulty}
		<div class="flex flex-wrap gap-4">
			{#if data.meal.prepTime}
				<div class="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
					<Clock class="h-5 w-5 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">{m.common_time_prepTime()}</p>
						<p class="font-medium">{data.meal.prepTime}</p>
					</div>
				</div>
			{/if}
			{#if data.meal.cookTime}
				<div class="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
					<Flame class="h-5 w-5 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">{m.common_time_cookTime()}</p>
						<p class="font-medium">{data.meal.cookTime}</p>
					</div>
				</div>
			{/if}
			{#if difficultyLabel}
				<div class="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
					<Gauge class="h-5 w-5 {difficultyColor}" />
					<div>
						<p class="text-xs text-muted-foreground">{m.common_time_difficulty()}</p>
						<p class="font-medium {difficultyColor}">{difficultyLabel}</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if data.meal.defaultNotes}
		<Card>
			<CardHeader>
				<CardTitle>{m.meals_defaultNotes()}</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-muted-foreground whitespace-pre-wrap">{data.meal.defaultNotes}</p>
			</CardContent>
		</Card>
	{/if}

	<div class="flex gap-2">
		<Button size="lg" onclick={cookToday}>
			{m.meals_cookedToday()}
		</Button>
		<Button variant="outline" size="lg" onclick={() => goto(`/entries/add?mealId=${data.meal.id}`)}>
			{m.diary_addEntry()}
		</Button>
	</div>
</div>
