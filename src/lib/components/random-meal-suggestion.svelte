<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ChefHat, Shuffle, Clock, Flame, Gauge, Sparkles, X } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';

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
			? m.common_difficulty_easy()
			: suggestedMeal?.difficulty === 'medium'
				? m.common_difficulty_medium()
				: suggestedMeal?.difficulty === 'hard'
					? m.common_difficulty_hard()
					: null
	);
</script>

<div
	class="relative h-full min-h-44 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent-variant p-5 text-primary-foreground shadow-lifted"
>
	<ChefHat
		class="pointer-events-none absolute -right-6 -bottom-8 size-44 rotate-[-12deg] opacity-15"
	/>

	{#if !showSuggestion || !suggestedMeal}
		<div class="relative flex h-full flex-col justify-between gap-6">
			<div>
				<div
					class="mb-3 inline-flex size-9 items-center justify-center rounded-2xl bg-primary-foreground/10"
				>
					<Sparkles class="size-4.5" />
				</div>
				<h2 class="max-w-xs text-2xl leading-tight font-extrabold">
					{m.randomMeal_whatShouldICook()}
				</h2>
				<p class="mt-1 text-sm opacity-75">{m.randomMeal_subtitle()}</p>
			</div>
			<Button
				class="w-fit bg-primary-foreground text-white hover:bg-primary-foreground/90"
				onclick={getRandomMeal}
				disabled={meals.length === 0}
			>
				<Shuffle />
				{m.randomMeal_shuffle()}
			</Button>
		</div>
	{:else}
		<button
			class="absolute top-3 right-3 z-10 rounded-full bg-primary-foreground/10 p-1.5 transition-colors hover:bg-primary-foreground/20"
			onclick={closeSuggestion}
			aria-label={m.common_close()}
		>
			<X class="size-4" />
		</button>
		<div class="relative flex h-full flex-col justify-between gap-4">
			<div class="flex items-center gap-4">
				<div
					class={[
						'size-24 shrink-0 overflow-hidden rounded-2xl bg-primary-foreground/10 ring-4 ring-primary-foreground/10',
						isShuffling && 'animate-pulse'
					]}
				>
					{#if suggestedMeal.defaultPhotoUrl}
						<img
							src={suggestedMeal.defaultPhotoUrl}
							alt={suggestedMeal.title}
							class="size-full object-cover"
						/>
					{:else}
						<div class="flex size-full items-center justify-center">
							<ChefHat class="size-10" />
						</div>
					{/if}
				</div>
				<div class="min-w-0 flex-1 pr-6">
					<p class="text-xs font-semibold tracking-wide uppercase opacity-70">
						{isShuffling ? m.randomMeal_pickingMeal() : m.randomMeal_howAboutThis()}
					</p>
					<h3
						class={[
							'mt-0.5 line-clamp-2 text-xl leading-tight font-extrabold',
							isShuffling && 'animate-pulse'
						]}
					>
						{suggestedMeal.title}
					</h3>
					{#if suggestedMeal.prepTime || suggestedMeal.cookTime || difficultyLabel}
						<div class="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
							{#if suggestedMeal.prepTime}
								<span
									class="flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2 py-1"
								>
									<Clock class="size-3" />
									{suggestedMeal.prepTime}
								</span>
							{/if}
							{#if suggestedMeal.cookTime}
								<span
									class="flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2 py-1"
								>
									<Flame class="size-3" />
									{suggestedMeal.cookTime}
								</span>
							{/if}
							{#if difficultyLabel}
								<span
									class="flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2 py-1"
								>
									<Gauge class="size-3" />
									{difficultyLabel}
								</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>
			{#if !isShuffling}
				<div class="flex gap-2">
					<Button
						onclick={cookMeal}
						class="flex-1 bg-primary-foreground text-white hover:bg-primary-foreground/90"
					>
						{m.randomMeal_cookToday()}
					</Button>
					<Button
						variant="ghost"
						onclick={viewMeal}
						class="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
					>
						{m.common_view()}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onclick={getRandomMeal}
						aria-label={m.randomMeal_shuffle()}
						class="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
					>
						<Shuffle />
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>
