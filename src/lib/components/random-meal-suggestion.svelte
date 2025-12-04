<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ChefHat, Shuffle, Clock, Flame, Gauge, Sparkles, X } from '@lucide/svelte';

	type Meal = {
		id: string;
		title: string;
		defaultPhotoUrl: string | null;
		prepTime: string | null;
		cookTime: string | null;
		difficulty: string | null;
		categories: Array<{ id: string; name: string }>;
	};

	type Props = {
		meals: Meal[];
	};

	let { meals }: Props = $props();

	let suggestedMeal = $state<Meal | null>(null);
	let isShuffling = $state(false);
	let showSuggestion = $state(false);

	function getRandomMeal() {
		if (meals.length === 0) return;

		isShuffling = true;
		showSuggestion = true;

		let shuffleCount = 0;
		const maxShuffles = 8;
		const shuffleInterval = setInterval(() => {
			const randomIndex = Math.floor(Math.random() * meals.length);
			suggestedMeal = meals[randomIndex];
			shuffleCount++;

			if (shuffleCount >= maxShuffles) {
				clearInterval(shuffleInterval);
				isShuffling = false;
			}
		}, 100);
	}

	function closeSuggestion() {
		showSuggestion = false;
		suggestedMeal = null;
	}

	function cookMeal() {
		if (!suggestedMeal) return;
		const today = new Date().toISOString().split('T')[0];
		goto(`/entries/add?step=3&date=${today}&mealId=${suggestedMeal.id}`);
	}

	function viewMeal() {
		if (!suggestedMeal) return;
		goto(`/meals/${suggestedMeal.id}`);
	}

	const difficultyLabel = $derived(
		suggestedMeal?.difficulty === 'easy'
			? 'Easy'
			: suggestedMeal?.difficulty === 'medium'
				? 'Medium'
				: suggestedMeal?.difficulty === 'hard'
					? 'Hard'
					: null
	);

	const difficultyColor = $derived(
		suggestedMeal?.difficulty === 'easy'
			? 'text-green-600'
			: suggestedMeal?.difficulty === 'medium'
				? 'text-yellow-600'
				: suggestedMeal?.difficulty === 'hard'
					? 'text-red-600'
					: ''
	);
</script>

<div class="space-y-4">
	{#if !showSuggestion}
		<Button
			variant="outline"
			class="w-full gap-2 border-dashed py-6"
			onclick={getRandomMeal}
			disabled={meals.length === 0}
		>
			<Sparkles class="h-5 w-5 text-amber-500" />
			<span>What should I cook today?</span>
		</Button>
	{:else}
		<Card class="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
			<button
				class="absolute right-2 top-2 rounded-full p-1 hover:bg-muted"
				onclick={closeSuggestion}
			>
				<X class="h-4 w-4" />
			</button>
			<CardContent class="pt-6">
				{#if suggestedMeal}
					<div class="flex items-start gap-4">
						{#if suggestedMeal.defaultPhotoUrl}
							<div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted {isShuffling ? 'animate-pulse' : ''}">
								<img
									src={suggestedMeal.defaultPhotoUrl}
									alt={suggestedMeal.title}
									class="h-full w-full object-cover"
								/>
							</div>
						{:else}
							<div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted {isShuffling ? 'animate-pulse' : ''}">
								<ChefHat class="h-10 w-10 text-muted-foreground" />
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
								{#if isShuffling}
									Picking a meal...
								{:else}
									How about this?
								{/if}
							</p>
							<h3 class="text-lg font-bold truncate {isShuffling ? 'animate-pulse' : ''}">
								{suggestedMeal.title}
							</h3>
							{#if suggestedMeal.categories.length > 0}
								<div class="mt-1 flex flex-wrap gap-1">
									{#each suggestedMeal.categories.slice(0, 3) as category}
										<Badge variant="secondary" class="text-xs">
											{category.name}
										</Badge>
									{/each}
								</div>
							{/if}
							{#if suggestedMeal.prepTime || suggestedMeal.cookTime || difficultyLabel}
								<div class="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
									{#if suggestedMeal.prepTime}
										<span class="flex items-center gap-1">
											<Clock class="h-3.5 w-3.5" />
											{suggestedMeal.prepTime}
										</span>
									{/if}
									{#if suggestedMeal.cookTime}
										<span class="flex items-center gap-1">
											<Flame class="h-3.5 w-3.5" />
											{suggestedMeal.cookTime}
										</span>
									{/if}
									{#if difficultyLabel}
										<span class="flex items-center gap-1 {difficultyColor}">
											<Gauge class="h-3.5 w-3.5" />
											{difficultyLabel}
										</span>
									{/if}
								</div>
							{/if}
						</div>
					</div>
					{#if !isShuffling}
						<div class="mt-4 flex gap-2">
							<Button size="sm" onclick={cookMeal} class="flex-1">
								Cook Today
							</Button>
							<Button size="sm" variant="outline" onclick={viewMeal}>
								View
							</Button>
							<Button size="sm" variant="ghost" onclick={getRandomMeal}>
								<Shuffle class="h-4 w-4" />
							</Button>
						</div>
					{/if}
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>

