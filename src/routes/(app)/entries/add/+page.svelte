<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		ArrowLeft,
		ArrowRight,
		Check,
		ChefHat,
		ImagePlus,
		Plus,
		Search,
		X
	} from '@lucide/svelte';
	import { addDays, formatDate, isSameDay, toDateString } from '$lib/utils/date';
	import * as m from '$lib/paraglide/messages.js';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	const step = $derived(data.step || 1);
	let selectedDate = $state<Date>(data.date ? new Date(data.date) : new Date());
	let selectedMealId = $state<string | null>(data.mealId || null);
	let searchQuery = $state('');
	let notes = $state('');
	let photoUrls = $state<string[]>([]);
	let photoFiles = $state<File[]>([]);
	let photoPreviews = $state<string[]>([]);

	const filteredMeals = $derived(
		searchQuery
			? data.allMeals.filter((meal) => meal.title.toLowerCase().includes(searchQuery.toLowerCase()))
			: data.allMeals
	);

	function nextStep() {
		if (step === 1) {
			goto(resolve(`/entries/add?step=2&date=${toDateString(selectedDate)}`));
		} else if (step === 2 && selectedMealId) {
			goto(
				resolve(`/entries/add?step=3&date=${toDateString(selectedDate)}&mealId=${selectedMealId}`)
			);
		}
	}

	function prevStep() {
		if (step === 2) {
			goto(resolve(`/entries/add?step=1&date=${toDateString(selectedDate)}`));
		} else if (step === 3) {
			goto(
				resolve(`/entries/add?step=2&date=${toDateString(selectedDate)}&mealId=${selectedMealId}`)
			);
		}
	}

	function selectMeal(mealId: string) {
		selectedMealId = mealId;
		nextStep();
	}

	const selectedMeal = $derived(
		selectedMealId ? data.allMeals.find((m) => m.id === selectedMealId) : null
	);

	function handlePhotoChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = Array.from(target.files || []);
		if (files.length > 0) {
			photoFiles = [...photoFiles, ...files];
			files.forEach((file) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					photoPreviews = [...photoPreviews, e.target?.result as string];
				};
				reader.readAsDataURL(file);
			});
		}
	}

	function removePhoto(index: number) {
		photoFiles = photoFiles.filter((_, i) => i !== index);
		photoPreviews = photoPreviews.filter((_, i) => i !== index);
		photoUrls = photoUrls.filter((_, i) => i !== index);
	}

	const steps = $derived([
		m.entries_step1_label(),
		m.entries_step2_label(),
		m.entries_step3_label()
	]);

	const quickDates = $derived.by(() => {
		const today = new Date();
		const yesterday = addDays(today, -1);
		return [
			{ label: m.common_today(), date: today },
			{ label: m.common_yesterday(), date: yesterday }
		];
	});
</script>

<svelte:head>
	<title>{m.entries_pageTitle()}</title>
</svelte:head>

{#snippet mealOption(meal: (typeof data.allMeals)[number])}
	{@const selected = selectedMealId === meal.id}
	<button
		type="button"
		class={[
			'flex w-full items-center gap-3 rounded-2xl border-2 p-2 pr-3 text-left transition-colors',
			selected
				? 'border-primary bg-primary/10'
				: 'border-transparent bg-secondary/60 hover:bg-secondary'
		]}
		onclick={() => selectMeal(meal.id)}
	>
		<span class="size-12 shrink-0 overflow-hidden rounded-xl bg-card">
			{#if meal.defaultPhotoUrl}
				<img src={meal.defaultPhotoUrl} alt="" class="size-full object-cover" loading="lazy" />
			{:else}
				<span class="flex size-full items-center justify-center bg-primary/15">
					<ChefHat class="size-5 text-primary" />
				</span>
			{/if}
		</span>
		<span class="min-w-0 flex-1">
			<span class="block truncate font-bold">{meal.title}</span>
			{#if meal.categories.length > 0}
				<span class="block truncate text-xs font-medium text-muted-foreground">
					{meal.categories.map((c) => c.name).join(' · ')}
				</span>
			{/if}
		</span>
		{#if selected}
			<span
				class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
			>
				<Check class="size-3.5" strokeWidth={3} />
			</span>
		{/if}
	</button>
{/snippet}

<div class="mx-auto max-w-2xl space-y-6 px-4 pt-6 md:px-8 md:pt-2">
	<header class="space-y-5">
		<h1 class="text-3xl font-extrabold md:text-4xl">
			{#if step === 1}
				{m.entries_step1_label()}
			{:else if step === 2}
				{m.entries_step2_label()}
			{:else}
				{m.entries_step3_label()}
			{/if}
		</h1>
		<ol class="flex items-center gap-2">
			{#each steps as label, index (label)}
				{@const number = index + 1}
				<li class="flex min-w-0 flex-1 flex-col gap-1.5">
					<span
						class={[
							'h-1.5 rounded-full transition-colors',
							step >= number ? 'bg-primary' : 'bg-secondary'
						]}
					></span>
					<span
						class={[
							'truncate text-xs font-semibold',
							step >= number ? 'text-foreground' : 'text-muted-foreground'
						]}
					>
						{number}. {label}
					</span>
				</li>
			{/each}
		</ol>
	</header>

	<div class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft md:p-6">
		{#if step === 1}
			<div class="space-y-5">
				<div class="flex gap-2">
					{#each quickDates as quick (quick.label)}
						<button
							type="button"
							onclick={() => (selectedDate = quick.date)}
							class={[
								'flex-1 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors',
								isSameDay(selectedDate, quick.date)
									? 'border-primary bg-primary/10'
									: 'border-transparent bg-secondary hover:bg-secondary/70'
							]}
						>
							{quick.label}
						</button>
					{/each}
				</div>
				<div>
					<Label for="date">{m.entries_selectDate()}</Label>
					<Input
						id="date"
						type="date"
						value={toDateString(selectedDate) || ''}
						oninput={(e) => {
							selectedDate = new Date(e.currentTarget.value);
						}}
						class="mt-2"
					/>
					<p class="mt-2 text-sm text-muted-foreground">{m.entries_dateHint()}</p>
				</div>
				<div class="flex justify-end gap-2">
					<Button variant="outline" onclick={() => goto(resolve('/'))}>{m.common_cancel()}</Button>
					<Button onclick={nextStep}>
						{m.common_next()}
						<ArrowRight />
					</Button>
				</div>
			</div>
		{:else if step === 2}
			<div class="space-y-5">
				<label
					class="flex h-12 items-center gap-3 rounded-full border bg-card px-5 transition-shadow focus-within:ring-[3px] focus-within:ring-ring/40"
				>
					<Search class="size-5 shrink-0 text-muted-foreground" />
					<span class="sr-only">{m.entries_searchMeals()}</span>
					<input
						id="search"
						type="text"
						placeholder={m.entries_searchMealsPlaceholder()}
						bind:value={searchQuery}
						class="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
					/>
				</label>

				{#if data.recentMeals.length > 0 && !searchQuery}
					<div>
						<h2 class="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
							{m.entries_recentMeals()}
						</h2>
						<div class="space-y-2">
							{#each data.recentMeals as meal (meal.id)}
								{@render mealOption(meal)}
							{/each}
						</div>
					</div>
				{/if}

				<div>
					<h2 class="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
						{m.entries_allMeals()}
					</h2>
					{#if filteredMeals.length > 0}
						<div class="max-h-96 space-y-2 overflow-y-auto">
							{#each filteredMeals as meal (meal.id)}
								{@render mealOption(meal)}
							{/each}
						</div>
					{:else}
						<p class="py-8 text-center text-muted-foreground">{m.entries_noMealsFound()}</p>
					{/if}
				</div>

				<div class="flex justify-between gap-2">
					<Button variant="outline" onclick={prevStep}>
						<ArrowLeft />
						{m.common_back()}
					</Button>
					<Button variant="secondary" onclick={() => goto(resolve('/meals/new'))}>
						<Plus />
						{m.entries_createNewMeal()}
					</Button>
				</div>
			</div>
		{:else if step === 3}
			{#if selectedMeal}
				<div class="space-y-5">
					<div class="flex items-center gap-4 rounded-2xl bg-secondary/60 p-3">
						<span class="size-16 shrink-0 overflow-hidden rounded-2xl bg-card">
							{#if selectedMeal.defaultPhotoUrl}
								<img src={selectedMeal.defaultPhotoUrl} alt="" class="size-full object-cover" />
							{:else}
								<span class="flex size-full items-center justify-center bg-primary/15">
									<ChefHat class="size-7 text-primary" />
								</span>
							{/if}
						</span>
						<div class="min-w-0">
							<p class="text-xs font-semibold text-muted-foreground">
								{m.entries_meal()} · {formatDate(selectedDate)}
							</p>
							<p class="truncate text-lg font-extrabold">{selectedMeal.title}</p>
							{#if selectedMeal.categories.length > 0}
								<div class="mt-1 flex flex-wrap gap-1">
									{#each selectedMeal.categories as category (category.id)}
										<span class="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold"
											>{category.name}</span
										>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<div>
						<Label for="notes">{m.entries_notesOptional()}</Label>
						<Textarea
							id="notes"
							placeholder={m.entries_notesPlaceholder()}
							bind:value={notes}
							class="mt-2"
							rows={4}
						/>
					</div>

					<div>
						<Label>{m.entries_photosOptional()}</Label>
						<div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
							{#each photoPreviews as preview, index (index)}
								<div class="relative aspect-square">
									<img
										src={preview}
										alt="{m.entries_photoPreview()} {index + 1}"
										class="size-full rounded-2xl object-cover"
									/>
									<button
										type="button"
										onclick={() => removePhoto(index)}
										class="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-1 text-white backdrop-blur-md hover:bg-black/70"
										aria-label={m.common_delete()}
									>
										<X class="size-3.5" />
									</button>
								</div>
							{/each}
							{#each photoUrls as url, index (index)}
								<div class="relative aspect-square">
									<img
										src={url}
										alt="Photo {index + 1}"
										class="size-full rounded-2xl object-cover"
									/>
									<button
										type="button"
										onclick={() => removePhoto(photoPreviews.length + index)}
										class="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-1 text-white backdrop-blur-md hover:bg-black/70"
										aria-label={m.common_delete()}
									>
										<X class="size-3.5" />
									</button>
								</div>
							{/each}
							<label
								for="photos"
								class="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
							>
								<ImagePlus class="size-6" />
								<span class="px-1 text-center text-[11px] font-semibold"
									>{m.entries_addPhotos()}</span
								>
							</label>
						</div>
						<input
							id="photos"
							type="file"
							accept="image/*"
							multiple
							onchange={handlePhotoChange}
							class="sr-only"
						/>
					</div>

					<form
						method="POST"
						use:enhance={({ formData, cancel }) => {
							if (!selectedMealId || !selectedDate) {
								cancel();
								alert(m.entries_pleaseSelectMealAndDate());
								return;
							}

							formData.append('mealId', selectedMealId);
							formData.append('dateCooked', toDateString(selectedDate) || '');
							formData.append('notes', notes);
							formData.append('photoUrls', JSON.stringify(photoUrls));

							photoFiles.forEach((file) => {
								formData.append('photos', file);
							});

							return async ({ result }) => {
								if (result.type === 'success') {
									goto(resolve('/'));
								} else if (result.type === 'failure') {
									alert(result.data?.error || m.entries_failedToCreate());
								}
							};
						}}
					>
						<div class="flex justify-between gap-2">
							<Button type="button" variant="outline" size="lg" onclick={prevStep}>
								<ArrowLeft />
								{m.common_back()}
							</Button>
							<Button type="submit" size="lg">{m.entries_saveEntry()}</Button>
						</div>
					</form>
				</div>
			{/if}
		{/if}
	</div>
</div>
