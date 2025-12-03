<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ArrowLeft, ArrowRight, Search, Plus, X } from '@lucide/svelte';
	import { formatDate, toDateString } from '$lib/utils/date';

	type Props = {
		data: PageData;
		form?: any;
	};

	let { data, form }: Props = $props();

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
			? data.allMeals.filter((meal) =>
					meal.title.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: data.allMeals
	);

	function nextStep() {
		if (step === 1) {
			goto(`/entries/add?step=2&date=${toDateString(selectedDate)}`);
		} else if (step === 2 && selectedMealId) {
			goto(`/entries/add?step=3&date=${toDateString(selectedDate)}&mealId=${selectedMealId}`);
		}
	}

	function prevStep() {
		if (step === 2) {
			goto(`/entries/add?step=1&date=${toDateString(selectedDate)}`);
		} else if (step === 3) {
			goto(`/entries/add?step=2&date=${toDateString(selectedDate)}&mealId=${selectedMealId}`);
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
			// Create previews
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

</script>

<svelte:head>
	<title>Add Entry - Cooking Diary</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<!-- Progress Steps -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full {step >= 1
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground'}"
				>
					1
				</div>
				<span class="text-sm font-medium">Pick Date</span>
			</div>
			<div class="h-1 flex-1 bg-muted mx-2"></div>
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full {step >= 2
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground'}"
				>
					2
				</div>
				<span class="text-sm font-medium">Choose Meal</span>
			</div>
			<div class="h-1 flex-1 bg-muted mx-2"></div>
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full {step >= 3
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground'}"
				>
					3
				</div>
				<span class="text-sm font-medium">Details</span>
			</div>
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>
				{#if step === 1}
					Add Entry - Pick Date
				{:else if step === 2}
					Add Entry - Choose Meal
				{:else}
					Add Entry - Details
				{/if}
			</CardTitle>
		</CardHeader>
		<CardContent>
			{#if step === 1}
				<!-- Step 1: Pick Date -->
				<div class="space-y-4">
					<div>
						<Label for="date">Select Date</Label>
						<Input
							id="date"
							type="date"
							value={toDateString(selectedDate) || ''}
							oninput={(e) => {
								selectedDate = new Date(e.currentTarget.value);
							}}
							class="mt-2"
						/>
					</div>
					<div class="flex justify-end gap-2">
						<Button variant="outline" onclick={() => goto('/')}>Cancel</Button>
						<Button onclick={nextStep}>
							Next
							<ArrowRight class="ml-2 h-4 w-4" />
						</Button>
					</div>
				</div>
			{:else if step === 2}
				<!-- Step 2: Choose Meal -->
				<div class="space-y-4">
					<div>
						<Label for="search">Search Meals</Label>
						<div class="relative mt-2">
							<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="search"
								type="text"
								placeholder="Search meals..."
								bind:value={searchQuery}
								class="pl-10"
							/>
						</div>
					</div>

					{#if data.recentMeals.length > 0 && !searchQuery}
						<div>
							<h3 class="mb-2 font-semibold">Recent Meals</h3>
							<div class="space-y-2">
								{#each data.recentMeals as meal}
									<button
										class="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent {selectedMealId === meal.id
											? 'border-primary bg-primary/10'
											: ''}"
										onclick={() => selectMeal(meal.id)}
									>
										<div class="flex items-center justify-between">
											<div class="flex-1">
												<h4 class="font-semibold">{meal.title}</h4>
												{#if meal.categories.length > 0}
													<div class="mt-1 flex flex-wrap gap-1">
														{#each meal.categories as category}
															<Badge variant="secondary" class="text-xs">
																{category.name}
															</Badge>
														{/each}
													</div>
												{/if}
											</div>
											{#if meal.defaultPhotoUrl}
												<span class="ml-2">📷</span>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<div>
						<h3 class="mb-2 font-semibold">All Meals</h3>
						{#if filteredMeals.length > 0}
							<div class="space-y-2 max-h-96 overflow-y-auto">
								{#each filteredMeals as meal}
									<button
										class="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent {selectedMealId === meal.id
											? 'border-primary bg-primary/10'
											: ''}"
										onclick={() => selectMeal(meal.id)}
									>
										<div class="flex items-center justify-between">
											<div class="flex-1">
												<h4 class="font-semibold">{meal.title}</h4>
												{#if meal.categories.length > 0}
													<div class="mt-1 flex flex-wrap gap-1">
														{#each meal.categories as category}
															<Badge variant="secondary" class="text-xs">
																{category.name}
															</Badge>
														{/each}
													</div>
												{/if}
											</div>
											{#if meal.defaultPhotoUrl}
												<span class="ml-2">📷</span>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						{:else}
							<p class="py-8 text-center text-muted-foreground">No meals found</p>
						{/if}
					</div>

					<div class="flex justify-between gap-2">
						<Button variant="outline" onclick={prevStep}>
							<ArrowLeft class="mr-2 h-4 w-4" />
							Back
						</Button>
						<Button variant="outline" onclick={() => goto('/meals/new')}>
							<Plus class="mr-2 h-4 w-4" />
							Create New Meal
						</Button>
					</div>
				</div>
			{:else if step === 3}
				<!-- Step 3: Entry Details -->
				{#if selectedMeal}
					<div class="space-y-4">
						<div>
							<Label>Meal</Label>
							<p class="mt-1 font-semibold">{selectedMeal.title}</p>
							{#if selectedMeal.categories.length > 0}
								<div class="mt-1 flex flex-wrap gap-1">
									{#each selectedMeal.categories as category}
										<Badge variant="secondary" class="text-xs">
											{category.name}
										</Badge>
									{/each}
								</div>
							{/if}
						</div>

						<div>
							<Label>Date</Label>
							<p class="mt-1">{formatDate(selectedDate)}</p>
						</div>

						<div>
							<Label for="notes">Notes (optional)</Label>
							<Textarea
								id="notes"
								placeholder="Add any notes about this cooking session..."
								bind:value={notes}
								class="mt-2"
								rows={4}
							/>
						</div>

						<div>
							<Label>Photos (optional)</Label>
							<div class="mt-2 space-y-3">
								{#if photoPreviews.length > 0 || photoUrls.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each photoPreviews as preview, index}
											<div class="relative">
												<img
													src={preview}
													alt="Photo preview {index + 1}"
													class="h-24 w-24 rounded-lg object-cover border"
												/>
												<button
													type="button"
													onclick={() => removePhoto(index)}
													class="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
												>
													<X class="h-3 w-3" />
												</button>
											</div>
										{/each}
										{#each photoUrls as url, index}
											<div class="relative">
												<img
													src={url}
													alt="Photo {index + 1}"
													class="h-24 w-24 rounded-lg object-cover border"
												/>
												<button
													type="button"
													onclick={() => removePhoto(photoPreviews.length + index)}
													class="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
												>
													<X class="h-3 w-3" />
												</button>
											</div>
										{/each}
									</div>
								{/if}
								<Input
									id="photos"
									type="file"
									accept="image/*"
									multiple
									onchange={handlePhotoChange}
									class="cursor-pointer"
								/>
							</div>
						</div>

						<form
							method="POST"
							use:enhance={({ formData, cancel }) => {
								if (!selectedMealId || !selectedDate) {
									cancel();
									alert('Please select a meal and date');
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
									goto('/');
								} else if (result.type === 'failure') {
									alert(result.data?.error || 'Failed to create entry');
								}
							};
							}}
						>
							<div class="flex justify-between gap-2">
								<Button type="button" variant="outline" onclick={prevStep}>
									<ArrowLeft class="mr-2 h-4 w-4" />
									Back
								</Button>
								<Button type="submit">Save Entry</Button>
							</div>
						</form>
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>

