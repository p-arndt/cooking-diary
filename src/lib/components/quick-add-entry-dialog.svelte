<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { X, Calendar as CalendarIcon, ChefHat, ChevronDown, Plus } from '@lucide/svelte';
	import { formatDate, toDateString } from '$lib/utils/date';
	import { CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date';

	type Meal = {
		id: string;
		title: string;
		categories: Array<{ id: string; name: string }>;
		defaultPhotoUrl: string | null;
	};

	type Props = {
		meals: Meal[];
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	};

	let { meals, open = $bindable(false), onOpenChange }: Props = $props();

	let selectedMealId = $state<string | null>(null);
	let selectedDate = $state<Date>(new Date());
	let calendarDate = $state<CalendarDate>(today(getLocalTimeZone()));
	let datePickerOpen = $state(false);
	let notes = $state('');
	let mealSearchQuery = $state('');
	let mealInputRef = $state<HTMLInputElement | null>(null);
	let showMealSuggestions = $state(false);
	let highlightedMealIndex = $state(-1);
	let isSubmitting = $state(false);
	let photoFile = $state<File | null>(null);
	let photoPreview = $state<string | null>(null);
	let showOptionalFields = $state(false);

	let isInitialized = $state(false);
	let previousCalendarDate = $state<CalendarDate | null>(null);

	// Sync calendarDate with selectedDate on mount
	$effect(() => {
		if (!isInitialized && selectedDate) {
			const dateStr = toDateString(selectedDate);
			if (dateStr) {
				try {
					calendarDate = parseDate(dateStr);
					previousCalendarDate = calendarDate;
				} catch {
					calendarDate = today(getLocalTimeZone());
					previousCalendarDate = calendarDate;
				}
			}
			isInitialized = true;
		}
	});

	// Update selectedDate when calendarDate changes (and close popover if open)
	$effect(() => {
		if (
			isInitialized &&
			calendarDate &&
			previousCalendarDate &&
			calendarDate.compare(previousCalendarDate) !== 0
		) {
			selectedDate = calendarDate.toDate(getLocalTimeZone());
			if (datePickerOpen) {
				datePickerOpen = false;
			}
		}
		previousCalendarDate = calendarDate;
	});

	const filteredMeals = $derived.by(() => {
		if (!mealSearchQuery.trim()) {
			return meals.slice(0, 10);
		}
		const query = mealSearchQuery.toLowerCase();
		return meals.filter((meal) => meal.title.toLowerCase().includes(query));
	});

	const selectedMeal = $derived(selectedMealId ? meals.find((m) => m.id === selectedMealId) : null);

	function selectMeal(mealId: string) {
		selectedMealId = mealId;
		mealSearchQuery = '';
		showMealSuggestions = false;
		highlightedMealIndex = -1;
	}

	function clearMealSelection() {
		selectedMealId = null;
		mealSearchQuery = '';
		showMealSuggestions = false;
		highlightedMealIndex = -1;
		mealInputRef?.focus();
	}

	function handleMealKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (highlightedMealIndex >= 0 && highlightedMealIndex < filteredMeals.length) {
				selectMeal(filteredMeals[highlightedMealIndex].id);
			} else if (filteredMeals.length > 0) {
				selectMeal(filteredMeals[0].id);
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

	function handleMealInputFocus() {
		showMealSuggestions = true;
	}

	function handleMealInputBlur() {
		setTimeout(() => {
			showMealSuggestions = false;
			highlightedMealIndex = -1;
		}, 200);
	}

	function handlePhotoChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			photoFile = file;
			const reader = new FileReader();
			reader.onload = (e) => {
				photoPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function removePhoto() {
		photoFile = null;
		photoPreview = null;
	}

	function resetForm() {
		selectedMealId = null;
		selectedDate = new Date();
		calendarDate = today(getLocalTimeZone());
		notes = '';
		mealSearchQuery = '';
		photoFile = null;
		photoPreview = null;
		datePickerOpen = false;
		showMealSuggestions = false;
		highlightedMealIndex = -1;
		showOptionalFields = false;
	}


	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
		if (!newOpen) {
			resetForm();
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Quick Add Entry</Dialog.Title>
			<Dialog.Description>Quickly add a meal entry to your diary</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action="/entries/add"
			enctype="multipart/form-data"
			use:enhance={({ formData, cancel }) => {
				if (!selectedMealId) {
					cancel();
					alert('Please select a meal');
					return;
				}

				isSubmitting = true;
				formData.append('mealId', selectedMealId);
				formData.append('dateCooked', toDateString(selectedDate) || '');

				return async ({ result }) => {
					isSubmitting = false;
					if (result.type === 'success') {
						resetForm();
						open = false;
						onOpenChange?.(false);
						await invalidateAll();
					} else if (result.type === 'failure') {
						alert(result.data?.error || 'Failed to create entry');
					}
				};
			}}
		>
			<div class="space-y-4">
				<!-- Date Selection -->
				<div>
					<Label>Date</Label>
					<Popover.Root bind:open={datePickerOpen}>
						<Popover.Trigger>
							<Button type="button" variant="outline" class="mt-2 w-full justify-start text-left font-normal">
								<CalendarIcon class="mr-2 h-4 w-4" />
								{#if calendarDate}
									{formatDate(selectedDate)}
								{:else}
									<span class="text-muted-foreground">Pick a date</span>
								{/if}
							</Button>
						</Popover.Trigger>
						<Popover.Content class="w-auto p-0" align="start">
							<Calendar bind:value={calendarDate} type="single" />
						</Popover.Content>
					</Popover.Root>
				</div>
				<!-- Meal Selection -->
				<div>
					<Label>Meal *</Label>
					<div class="relative mt-2">
						{#if selectedMeal}
							<div
								class="flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
							>
								<div class="flex flex-1 items-center gap-2">
									{#if selectedMeal.defaultPhotoUrl}
										<img
											src={selectedMeal.defaultPhotoUrl}
											alt={selectedMeal.title}
											class="h-6 w-6 rounded object-cover"
										/>
									{:else}
										<ChefHat class="h-4 w-4 text-muted-foreground" />
									{/if}
									<div class="flex-1">
										<p class="font-medium">{selectedMeal.title}</p>
										{#if selectedMeal.categories.length > 0}
											<div class="mt-0.5 flex flex-wrap gap-1">
												{#each selectedMeal.categories as category}
													<Badge variant="secondary" class="text-xs">
														{category.name}
													</Badge>
												{/each}
											</div>
										{/if}
									</div>
								</div>
								<button
									type="button"
									class="rounded-sm p-1 transition-colors hover:bg-muted"
									onclick={clearMealSelection}
									onmousedown={(e) => e.preventDefault()}
								>
									<X class="h-4 w-4" />
								</button>
							</div>
						{:else}
							<div
								class="flex min-h-9 w-full items-center rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs ring-offset-background transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 md:text-sm"
							>
								<input
									bind:this={mealInputRef}
									bind:value={mealSearchQuery}
									onkeydown={handleMealKeydown}
									onfocus={handleMealInputFocus}
									onblur={handleMealInputBlur}
									oninput={() => {
										showMealSuggestions = true;
										highlightedMealIndex = -1;
									}}
									placeholder="Search meals..."
									class="w-full border-0 bg-transparent p-0 text-base outline-none placeholder:text-muted-foreground md:text-sm"
								/>
							</div>
						{/if}
					{#if showMealSuggestions}
						<div
							class="absolute top-full z-50 mt-1.5 max-h-[300px] w-full overflow-auto rounded-md border bg-popover shadow-lg"
						>
							<div class="p-1">
								{#if filteredMeals.length > 0}
									{#each filteredMeals as meal, index}
										<button
											type="button"
											class="w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground {highlightedMealIndex ===
											index
												? 'bg-accent text-accent-foreground'
												: ''}"
											onclick={() => selectMeal(meal.id)}
											onmouseenter={() => (highlightedMealIndex = index)}
											onmousedown={(e) => e.preventDefault()}
										>
											<div class="flex items-center gap-2">
												{#if meal.defaultPhotoUrl}
													<img
														src={meal.defaultPhotoUrl}
														alt={meal.title}
														class="h-5 w-5 rounded object-cover"
													/>
												{:else}
													<ChefHat class="h-4 w-4 text-muted-foreground" />
												{/if}
												<span class="flex-1">{meal.title}</span>
												{#if meal.categories.length > 0}
													<div class="flex gap-1">
														{#each meal.categories.slice(0, 2) as category}
															<Badge variant="secondary" class="text-xs">
																{category.name}
															</Badge>
														{/each}
													</div>
												{/if}
											</div>
										</button>
									{/each}
									<div class="my-1 border-t"></div>
								{:else if mealSearchQuery.trim()}
									<p class="px-2 py-1.5 text-sm text-muted-foreground">No meals found</p>
									<div class="my-1 border-t"></div>
								{/if}
								<button
									type="button"
									class="w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
									onclick={() => {
										open = false;
										goto('/meals/new');
									}}
									onmousedown={(e) => e.preventDefault()}
								>
									<div class="flex items-center gap-2 text-primary">
										<Plus class="h-4 w-4" />
										<span>Create new meal</span>
									</div>
								</button>
							</div>
						</div>
					{/if}
					</div>
				</div>

				<!-- Optional Fields (Collapsible) -->
				<Collapsible.Root bind:open={showOptionalFields}>
					<Collapsible.Trigger>
						<div class="flex items-center justify-between space-x-2">
							<span class="text-sm font-normal text-muted-foreground">Optional fields</span>
							<ChevronDown
								class="h-4 w-4 transition-transform duration-200 {showOptionalFields
									? 'rotate-180'
									: ''}"
							/>
						</div>
					</Collapsible.Trigger>
					<Collapsible.Content class="space-y-4 pt-2">
						<!-- Notes -->
						<div>
							<Label for="notes">Notes (optional)</Label>
						<Textarea
							id="notes"
							name="notes"
							placeholder="Add any notes..."
							bind:value={notes}
							class="mt-2"
							rows={3}
						/>
						</div>

						<!-- Photo -->
						<div>
							<Label>Photo (optional)</Label>
							<div class="mt-2 space-y-2">
								{#if photoPreview}
									<div class="relative inline-block">
										<img
											src={photoPreview}
											alt="preview"
											class="h-24 w-24 rounded-lg border object-cover"
										/>
										<button
											type="button"
											onclick={removePhoto}
											class="text-destructive-foreground absolute -top-2 -right-2 rounded-full bg-destructive p-1 hover:bg-destructive/90"
										>
											<X class="h-3 w-3" />
										</button>
									</div>
								{/if}
							<Input
								type="file"
								name="photos"
								accept="image/*"
								onchange={handlePhotoChange}
								class="cursor-pointer"
							/>
							</div>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			</div>

			<Dialog.Footer class="pt-4">
				<Button type="button" variant="outline" disabled={isSubmitting} onclick={() => { open = false; }}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting || !selectedMealId}>
					{isSubmitting ? 'Adding...' : 'Add Entry'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
