<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { NativeSelect } from '$lib/components/ui/native-select/index.js';
	import CategoryInput from '$lib/components/category-input.svelte';
	import { ArrowLeft, X, Clock, Flame } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data }: { data: PageData } = $props();

	let title = $state('');
	let defaultNotes = $state('');
	let selectedCategoryIds = $state<string[]>([]);
	let categories = $state(data.categories);
	let photoFile = $state<File | null>(null);
	let photoPreview = $state<string | null>(null);
	let isSubmitting = $state(false);

	let prepTime = $state('');
	let cookTime = $state('');
	let difficulty = $state('');

	async function createCategory(name: string) {
		try {
			const formData = new FormData();
			formData.append('name', name);

			const response = await fetch('/categories?/create', {
				method: 'POST',
				body: formData,
				headers: {
					'x-sveltekit-action': 'true'
				}
			});

			const result = await response.json();
			if (result.type === 'success' && result.data?.category) {
				categories = [...categories, result.data.category];
				return result.data.category;
			}
			return null;
		} catch (error) {
			console.error('Error creating category:', error);
			return null;
		}
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
</script>

<svelte:head>
	<title>{m.meals_addMealTitle()} - {m.common_appName()}</title>
</svelte:head>

<div class="container mx-auto max-w-2xl space-y-6 px-4 py-8">
	<Button variant="ghost" onclick={() => goto('/meals')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		{m.meals_backToMeals()}
	</Button>

	<Card>
		<CardHeader>
			<CardTitle>{m.meals_addMealTitle()}</CardTitle>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				class="space-y-6"
				use:enhance={({ formData, cancel }) => {
					if (!title.trim()) {
						cancel();
						alert(m.meals_form_titleRequired());
						return;
					}

					isSubmitting = true;
					formData.append('title', title);
					formData.append('defaultNotes', defaultNotes);
					formData.append('categoryIds', JSON.stringify(selectedCategoryIds));
					formData.append('prepTime', prepTime);
					formData.append('cookTime', cookTime);
					formData.append('difficulty', difficulty);
					if (photoFile) {
						formData.append('photo', photoFile);
					}

					return async ({ result }) => {
						isSubmitting = false;
						if (result.type === 'success' && result.data?.mealId) {
							goto(`/meals/${result.data.mealId}`);
						} else if (result.type === 'failure') {
							alert(result.data?.error || m.meals_form_failedToCreate());
						}
					};
				}}
			>
				<div>
					<Label for="title">{m.meals_form_title()} *</Label>
					<Input
						id="title"
						type="text"
						placeholder={m.meals_form_titlePlaceholder()}
						bind:value={title}
						required
						class="mt-2"
					/>
				</div>

				<div>
					<Label>{m.meals_form_categories()}</Label>
					<div class="mt-2">
						<CategoryInput
							{categories}
							{selectedCategoryIds}
							onChange={(ids) => {
								selectedCategoryIds = ids;
							}}
							onCreateCategory={createCategory}
							placeholder={m.meals_form_categoriesPlaceholder()}
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div>
						<Label for="prepTime" class="flex items-center gap-2">
							<Clock class="h-4 w-4" />
							{m.common_time_prepTime()}
						</Label>
						<Input
							id="prepTime"
							type="text"
							placeholder={m.meals_form_prepTimePlaceholder()}
							bind:value={prepTime}
							class="mt-2"
						/>
					</div>
					<div>
						<Label for="cookTime" class="flex items-center gap-2">
							<Flame class="h-4 w-4" />
							{m.common_time_cookTime()}
						</Label>
						<Input
							id="cookTime"
							type="text"
							placeholder={m.meals_form_cookTimePlaceholder()}
							bind:value={cookTime}
							class="mt-2"
						/>
					</div>
					<div>
						<Label for="difficulty">{m.common_time_difficulty()}</Label>
						<NativeSelect
							id="difficulty"
							bind:value={difficulty}
							class="mt-2 w-full"
						>
							<option value="">{m.common_difficulty_select()}</option>
							<option value="easy">{m.common_difficulty_easy()}</option>
							<option value="medium">{m.common_difficulty_medium()}</option>
							<option value="hard">{m.common_difficulty_hard()}</option>
						</NativeSelect>
					</div>
				</div>

				<div>
					<Label for="defaultNotes">{m.meals_form_defaultNotes()}</Label>
					<Textarea
						id="defaultNotes"
						placeholder={m.meals_form_defaultNotesPlaceholder()}
						bind:value={defaultNotes}
						class="mt-2"
						rows={4}
					/>
				</div>

				<div>
					<Label>{m.meals_form_photo()}</Label>
					<div class="mt-2 space-y-3">
						{#if photoPreview}
							<div class="relative inline-block">
								<img
									src={photoPreview}
									alt={m.meals_form_mealPreview()}
									class="h-32 w-32 rounded-lg object-cover border"
								/>
								<button
									type="button"
									onclick={removePhoto}
									class="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
								>
									<X class="h-4 w-4" />
								</button>
							</div>
						{/if}
						<Input
							id="photo"
							type="file"
							accept="image/*"
							onchange={handlePhotoChange}
							class="cursor-pointer"
						/>
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" onclick={() => goto('/meals')} disabled={isSubmitting}>
						{m.common_cancel()}
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? m.common_saving() : m.meals_form_saveMeal()}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
