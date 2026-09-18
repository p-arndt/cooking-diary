<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { formatDate, isToday } from '$lib/utils/date';
	import { ArrowLeft, CalendarPlus, ChefHat, Clock, Flame, Gauge, Pencil } from '@lucide/svelte';
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

	const facts = $derived(
		[
			{ icon: Clock, label: m.common_time_prepTime(), value: data.meal.prepTime, tint: 'bg-primary/15 text-primary' },
			{ icon: Flame, label: m.common_time_cookTime(), value: data.meal.cookTime, tint: 'bg-accent/15 text-accent' },
			{ icon: Gauge, label: m.common_time_difficulty(), value: difficultyLabel, tint: 'bg-chart-2/15 text-chart-2' }
		].filter((fact) => fact.value)
	);

	async function cookToday() {
		const today = new Date().toISOString().split('T')[0];
		goto(`/entries/add?step=3&date=${today}&mealId=${data.meal.id}`);
	}
</script>

<svelte:head>
	<title>{data.meal.title} - {m.common_appName()}</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6 px-4 pt-4 md:px-8 md:pt-2">
	<div class="relative -mx-4 overflow-hidden bg-secondary md:mx-0 md:rounded-3xl md:shadow-soft">
		<div class="aspect-[4/3] w-full md:aspect-[21/9]">
			{#if data.meal.defaultPhotoUrl}
				<img src={data.meal.defaultPhotoUrl} alt={data.meal.title} class="size-full object-cover" />
			{:else}
				<div class="flex size-full items-center justify-center bg-gradient-to-br from-primary/40 via-primary/20 to-accent/30">
					<ChefHat class="size-28 rotate-[-10deg] text-primary/70" />
				</div>
			{/if}
		</div>

		<div class="absolute inset-x-0 top-0 flex items-center justify-between p-4">
			<a
				href="/meals"
				class="flex size-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/50"
				aria-label={m.meals_backToMeals()}
			>
				<ArrowLeft class="size-5" />
			</a>
			<a
				href="/meals/{data.meal.id}/edit"
				class="flex size-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/50"
				aria-label={m.meals_editMeal()}
			>
				<Pencil class="size-4.5" />
			</a>
		</div>

		<div class="absolute inset-x-3 bottom-3 rounded-3xl border border-white/15 bg-black/40 p-4 text-white backdrop-blur-md md:inset-x-4 md:bottom-4 md:p-5">
			{#if data.meal.categories.length > 0}
				<div class="mb-2 flex flex-wrap gap-1.5">
					{#each data.meal.categories as category (category.id)}
						<span class="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">{category.name}</span>
					{/each}
				</div>
			{/if}
			<h1 class="text-2xl leading-tight font-extrabold md:text-4xl">{data.meal.title}</h1>
		</div>
	</div>

	{#if facts.length > 0}
		<div class="grid grid-cols-3 gap-3">
			{#each facts as fact (fact.label)}
				<div class="rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
					<div class={['mb-3 flex size-9 items-center justify-center rounded-2xl', fact.tint]}>
						<fact.icon class="size-4.5" />
					</div>
					<p class="truncate font-bold">{fact.value}</p>
					<p class="truncate text-xs font-medium text-muted-foreground">{fact.label}</p>
				</div>
			{/each}
		</div>
	{/if}

	<div class="grid grid-cols-2 gap-2 md:flex">
		<Button size="lg" class="px-4 text-sm md:px-7 md:text-base" onclick={cookToday}>
			<ChefHat />
			{m.meals_cookedToday()}
		</Button>
		<Button variant="outline" size="lg" class="px-4 text-sm md:px-7 md:text-base" onclick={() => goto(`/entries/add?mealId=${data.meal.id}`)}>
			<CalendarPlus />
			{m.diary_addEntry()}
		</Button>
	</div>

	<div class="grid gap-4 md:grid-cols-5">
		{#if data.meal.defaultNotes}
			<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft md:col-span-3">
				<h2 class="mb-2 text-lg font-bold">{m.meals_defaultNotes()}</h2>
				<p class="whitespace-pre-wrap text-muted-foreground">{data.meal.defaultNotes}</p>
			</section>
		{/if}

		<section
			class={[
				'rounded-3xl border border-border/60 bg-card p-5 shadow-soft',
				data.meal.defaultNotes ? 'md:col-span-2' : 'md:col-span-5'
			]}
		>
			<div class="mb-4 flex items-center justify-between gap-3">
				<h2 class="text-lg font-bold">{m.meals_cookHistory()}</h2>
				<span class="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
					{m.diary_times({ count: data.entries.length })}
				</span>
			</div>
			{#if data.entries.length > 0}
				<ol class="relative space-y-4 border-l-2 border-dashed border-primary/30 pl-5">
					{#each data.entries as entry (entry.id)}
						<li class="relative">
							<span class="absolute top-1.5 -left-[27px] size-3 rounded-full bg-primary ring-4 ring-card"></span>
							<p class="font-semibold">
								{formatDate(entry.dateCooked)}
								{#if isToday(entry.dateCooked)}
									<span class="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{m.common_today()}</span>
								{/if}
							</p>
							{#if entry.notes}
								<p class="mt-0.5 text-sm text-muted-foreground">{entry.notes}</p>
							{/if}
						</li>
					{/each}
				</ol>
			{:else}
				<p class="text-sm text-muted-foreground">{m.diary_notCookedYet()}</p>
			{/if}
		</section>
	</div>
</div>
