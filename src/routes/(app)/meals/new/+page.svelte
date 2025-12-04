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
	<title>Add Meal - Cooking Diary</title>
</svelte:head>

<div class="container mx-auto max-w-2xl space-y-6 px-4 py-8">
	<!-- Back Button -->
	<Button variant="ghost" onclick={() => goto('/meals')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Meals
	</Button>

	<Card>
		<CardHeader>
			<CardTitle>Add Meal</CardTitle>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				class="space-y-6"
				use:enhance={({ formData, cancel }) => {
					if (!title.trim()) {
						cancel();
						alert('Please enter a meal title');
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
							alert(result.data?.error || 'Failed to create meal');
						}
					};
				}}
			>
				<div>
					<Label for="title">Title *</Label>
					<Input
						id="title"
						type="text"
						placeholder="e.g., Spaghetti Carbonara"
						bind:value={title}
						required
						class="mt-2"
					/>
				</div>

				<div>
					<Label>Categories</Label>
					<div class="mt-2">
						<CategoryInput
							{categories}
							{selectedCategoryIds}
							onChange={(ids) => {
								selectedCategoryIds = ids;
							}}
							onCreateCategory={createCategory}
							placeholder="Type to add categories (press Enter or comma to create)"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div>
						<Label for="prepTime" class="flex items-center gap-2">
							<Clock class="h-4 w-4" />
							Prep Time
						</Label>
						<Input
							id="prepTime"
							type="text"
							placeholder="e.g., 15 min"
							bind:value={prepTime}
							class="mt-2"
						/>
					</div>
					<div>
						<Label for="cookTime" class="flex items-center gap-2">
							<Flame class="h-4 w-4" />
							Cook Time
						</Label>
						<Input
							id="cookTime"
							type="text"
							placeholder="e.g., 30 min"
							bind:value={cookTime}
							class="mt-2"
						/>
					</div>
					<div>
						<Label for="difficulty">Difficulty</Label>
						<NativeSelect
							id="difficulty"
							bind:value={difficulty}
							class="mt-2 w-full"
						>
							<option value="">Select difficulty</option>
							<option value="easy">Easy</option>
							<option value="medium">Medium</option>
							<option value="hard">Hard</option>
						</NativeSelect>
					</div>
				</div>

				<div>
					<Label for="defaultNotes">Default Notes</Label>
					<Textarea
						id="defaultNotes"
						placeholder="Add default notes for this meal..."
						bind:value={defaultNotes}
						class="mt-2"
						rows={4}
					/>
				</div>

				<div>
					<Label>Photo</Label>
					<div class="mt-2 space-y-3">
						{#if photoPreview}
							<div class="relative inline-block">
								<img
									src={photoPreview}
									alt="Meal preview"
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
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Saving...' : 'Save Meal'}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
