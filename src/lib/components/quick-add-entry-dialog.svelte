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
	import * as m from '$lib/paraglide/messages.js';

	type Meal = {
		id: string;
		title: string;
		categories: Array<{ id: string; name: string }>;
		defaultPhotoUrl: string | null;
	};

	type Entry = {
		id: string;
		meal: Meal;
		notes: string | null;
		photoUrls: string[] | null;
		dateCooked: Date | string | undefined;
	};

	type Props = {
		meals: Meal[];
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		entry?: Entry | null;
	};

	let { meals, open = $bindable(false), onOpenChange, entry = null }: Props = $props();

	const isEditMode = $derived(entry !== null);

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
	let photoFiles = $state<File[]>([]);
	let photoPreviews = $state<string[]>([]);
	let showOptionalFields = $state(false);

	let isInitialized = $state(false);
	let previousCalendarDate = $state<CalendarDate | null>(null);

	$effect(() => {
		if (entry && !isInitialized && entry.dateCooked) {
			selectedMealId = entry.meal.id;
			const entryDate = typeof entry.dateCooked === 'string' ? new Date(entry.dateCooked) : entry.dateCooked;
			selectedDate = entryDate;
			notes = entry.notes || '';
			photoPreviews = entry.photoUrls || [];
			const dateStr = toDateString(entryDate);
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
		} else if (!isInitialized && selectedDate) {
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
		const existingUrlsLength = entry?.photoUrls?.length || 0;
		if (index < existingUrlsLength) {
			photoPreviews = photoPreviews.filter((_, i) => i !== index);
		} else {
			const fileIndex = index - existingUrlsLength;
			photoFiles = photoFiles.filter((_, i) => i !== fileIndex);
			photoPreviews = photoPreviews.filter((_, i) => i !== index);
		}
	}

	function resetForm() {
		if (entry && entry.dateCooked) {
			selectedMealId = entry.meal.id;
			const entryDate = typeof entry.dateCooked === 'string' ? new Date(entry.dateCooked) : entry.dateCooked;
			selectedDate = entryDate;
			notes = entry.notes || '';
			photoPreviews = entry.photoUrls || [];
			const dateStr = toDateString(entryDate);
			if (dateStr) {
				try {
					calendarDate = parseDate(dateStr);
				} catch {
					calendarDate = today(getLocalTimeZone());
				}
			}
		} else {
			selectedMealId = null;
			selectedDate = new Date();
			calendarDate = today(getLocalTimeZone());
			notes = '';
			photoPreviews = [];
		}
		mealSearchQuery = '';
		photoFiles = [];
		datePickerOpen = false;
		showMealSuggestions = false;
		highlightedMealIndex = -1;
		showOptionalFields = false;
		isInitialized = false;
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
			<Dialog.Title>{isEditMode ? m.quickAdd_editTitle() : m.quickAdd_title()}</Dialog.Title>
			<Dialog.Description>{isEditMode ? m.quickAdd_editDescription() : m.quickAdd_description()}</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action={isEditMode ? undefined : '/entries/add'}
			enctype={isEditMode ? undefined : 'multipart/form-data'}
			use:enhance={({ formData, cancel }) => {
				if (!selectedMealId) {
					cancel();
					alert(m.quickAdd_pleaseSelectMeal());
					return;
				}

				isSubmitting = true;

				if (isEditMode && entry) {
					const existingPhotoUrls = entry.photoUrls || [];
					const newPhotoUrls: string[] = [];

					for (let i = 0; i < photoPreviews.length; i++) {
						const preview = photoPreviews[i];
						if (preview.startsWith('http') || preview.startsWith('/files/')) {
							newPhotoUrls.push(preview);
						}
					}

					return async () => {
						try {
							for (const file of photoFiles) {
								const uploadFormData = new FormData();
								uploadFormData.append('file', file);
								const uploadResponse = await fetch('/api/files', {
									method: 'POST',
									body: uploadFormData
								});
								if (uploadResponse.ok) {
									const result = await uploadResponse.json();
									newPhotoUrls.push(result.url);
								}
							}

							const response = await fetch('/api/entries', {
								method: 'PATCH',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									id: entry.id,
									mealId: selectedMealId,
									dateCooked: toDateString(selectedDate) || '',
									notes: notes || null,
									photoUrls: newPhotoUrls
								})
							});

							isSubmitting = false;
							if (response.ok) {
								resetForm();
								open = false;
								onOpenChange?.(false);
								await invalidateAll();
							} else {
								const error = await response.json();
								alert(error.error || m.quickAdd_failedToUpdate());
							}
						} catch (error) {
							isSubmitting = false;
							console.error('Error updating entry:', error);
							alert(m.quickAdd_failedToUpdate());
						}
					};
				} else {
					formData.append('mealId', selectedMealId);
					formData.append('dateCooked', toDateString(selectedDate) || '');
					if (notes) formData.append('notes', notes);
					if (photoFiles.length > 0) {
						photoFiles.forEach((file) => {
							formData.append('photos', file);
						});
					}

					return async ({ result }) => {
						isSubmitting = false;
						if (result.type === 'success') {
							resetForm();
							open = false;
							onOpenChange?.(false);
							await invalidateAll();
						} else if (result.type === 'failure') {
							alert(result.data?.error || m.quickAdd_failedToCreate());
						}
					};
				}
			}}
		>
			<div class="space-y-4">
				<div>
					<Label>{m.quickAdd_date()}</Label>
					<Popover.Root bind:open={datePickerOpen}>
						<Popover.Trigger>
							<Button type="button" variant="outline" class="mt-2 w-full justify-start text-left font-normal">
								<CalendarIcon class="mr-2 h-4 w-4" />
								{#if calendarDate}
									{formatDate(selectedDate)}
								{:else}
									<span class="text-muted-foreground">{m.common_pickDate()}</span>
								{/if}
							</Button>
						</Popover.Trigger>
						<Popover.Content class="w-auto p-0" align="start">
							<Calendar bind:value={calendarDate} type="single" />
						</Popover.Content>
					</Popover.Root>
					<p class="mt-1 text-sm text-muted-foreground">{m.quickAdd_dateHint()}</p>
				</div>
				<div>
					<Label>{m.quickAdd_mealRequired()}</Label>
					<div class="relative mt-2" style="overflow: visible;">
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
									placeholder={m.quickAdd_searchMealsPlaceholder()}
									class="w-full border-0 bg-transparent p-0 text-base outline-none placeholder:text-muted-foreground md:text-sm"
								/>
							</div>
						{/if}
					{#if showMealSuggestions}
						<div
							class="absolute top-full z-[100] mt-1.5 max-h-[150px] w-full rounded-md border bg-popover shadow-lg md:max-h-[300px]"
							style="touch-action: pan-y;"
						>
							<div class="max-h-[150px] overflow-y-scroll overflow-x-hidden p-1 md:max-h-[300px]" style="-webkit-overflow-scrolling: touch; overscroll-behavior: contain;">
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
									<p class="px-2 py-1.5 text-sm text-muted-foreground">{m.quickAdd_noMealsFound()}</p>
									<div class="my-1 border-t"></div>
								{/if}
								<button
									type="button"
									class="w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
									onclick={() => {
										open = false;
										goto('/meals/new');
									}}
								>
									<div class="flex items-center gap-2 text-primary">
										<Plus class="h-4 w-4" />
										<span>{m.quickAdd_createNewMeal()}</span>
									</div>
								</button>
							</div>
						</div>
					{/if}
					</div>
				</div>

				<Collapsible.Root bind:open={showOptionalFields}>
					<Collapsible.Trigger>
						<div class="flex items-center justify-between space-x-2">
							<span class="text-sm font-normal text-muted-foreground">{m.quickAdd_optionalFields()}</span>
							<ChevronDown
								class="h-4 w-4 transition-transform duration-200 {showOptionalFields
									? 'rotate-180'
									: ''}"
							/>
						</div>
					</Collapsible.Trigger>
					<Collapsible.Content class="space-y-4 pt-2">
						<div>
							<Label for="notes">{m.quickAdd_notesOptional()}</Label>
							<Textarea
								id="notes"
								name="notes"
								placeholder={m.quickAdd_notesPlaceholder()}
								bind:value={notes}
								class="mt-2"
								rows={3}
							/>
						</div>

						<div>
							<Label>{m.quickAdd_photoOptional()}</Label>
							<div class="mt-2 space-y-3">
								{#if photoPreviews.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each photoPreviews as preview, index}
											<div class="relative">
												<img
													src={preview}
													alt="{m.entries_photoPreview()} {index + 1}"
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
									</div>
								{/if}
								<Input
									type="file"
									name="photos"
									accept="image/*"
									multiple
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
					{m.common_cancel()}
				</Button>
				{#if isEditMode}
					<Button 
						type="button" 
						disabled={isSubmitting || !selectedMealId} 
						onclick={async () => {
							if (!selectedMealId || !entry) return;
							
							isSubmitting = true;
							try {
								const existingPhotoUrls = entry.photoUrls || [];
								const newPhotoUrls: string[] = [];

								for (let i = 0; i < photoPreviews.length; i++) {
									const preview = photoPreviews[i];
									if (preview.startsWith('http') || preview.startsWith('/files/')) {
										newPhotoUrls.push(preview);
									}
								}

								for (const file of photoFiles) {
									const uploadFormData = new FormData();
									uploadFormData.append('file', file);
									const uploadResponse = await fetch('/api/files', {
										method: 'POST',
										body: uploadFormData
									});
									if (uploadResponse.ok) {
										const result = await uploadResponse.json();
										newPhotoUrls.push(result.url);
									}
								}

								const response = await fetch('/api/entries', {
									method: 'PATCH',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({
										id: entry.id,
										mealId: selectedMealId,
										dateCooked: toDateString(selectedDate) || '',
										notes: notes || null,
										photoUrls: newPhotoUrls
									})
								});

								isSubmitting = false;
								if (response.ok) {
									resetForm();
									open = false;
									onOpenChange?.(false);
									await invalidateAll();
								} else {
									const error = await response.json();
									alert(error.error || m.quickAdd_failedToUpdate());
								}
							} catch (error) {
								isSubmitting = false;
								console.error('Error updating entry:', error);
								alert(m.quickAdd_failedToUpdate());
							}
						}}
					>
						{isSubmitting ? m.common_saving() : m.common_save()}
					</Button>
				{:else}
					<Button type="submit" disabled={isSubmitting || !selectedMealId}>
						{isSubmitting ? m.quickAdd_adding() : m.quickAdd_addEntry()}
					</Button>
				{/if}
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
