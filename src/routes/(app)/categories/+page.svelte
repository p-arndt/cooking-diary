<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Plus, Edit, Trash2, ChevronDown, ChevronRight, ChefHat } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as m from '$lib/paraglide/messages.js';

	let { data }: { data: PageData } = $props();

	let editingCategory = $state<{ id: string; name: string } | null>(null);
	let editingName = $state('');
	let deleteCategoryId = $state<string | null>(null);
	let newCategoryName = $state('');
	let showAddDialog = $state(false);
	let expandedCategories = $state<Set<string>>(new Set());

	function startEdit(category: { id: string; name: string }) {
		editingCategory = category;
		editingName = category.name;
	}

	function cancelEdit() {
		editingCategory = null;
		editingName = '';
	}

	function toggleCategory(categoryId: string) {
		if (expandedCategories.has(categoryId)) {
			expandedCategories.delete(categoryId);
		} else {
			expandedCategories.add(categoryId);
		}
		expandedCategories = new Set(expandedCategories);
	}
</script>

<svelte:head>
	<title>{m.categories_pageTitle()}</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold tracking-tight">{m.categories_title()}</h1>
			<p class="mt-1 text-muted-foreground">{m.categories_subtitle()}</p>
		</div>
		<Button onclick={() => (showAddDialog = true)}>
			<Plus class="mr-2 h-4 w-4" />
			{m.categories_addCategory()}
		</Button>
	</div>

	{#if data.categories.length > 0}
		<Card>
			<CardContent>
				<div class="divide-y">
					{#each data.categories as category}
						<div class="px-4 py-3">
							<div class="flex items-center justify-between">
								{#if editingCategory?.id === category.id}
									<form
										method="POST"
										action="?/edit"
										class="flex flex-1 items-center gap-2"
										use:enhance={({ formData }) => {
											formData.append('id', category.id);
											formData.append('name', editingName.trim());

											return async ({ result }) => {
												if (result.type === 'success') {
													cancelEdit();
												} else if (result.type === 'failure') {
													alert(result.data?.error || m.categories_failedToUpdate());
												}
											};
										}}
									>
										<Input bind:value={editingName} class="flex-1" />
										<Button type="submit" size="sm">{m.common_save()}</Button>
										<Button type="button" size="sm" variant="outline" onclick={cancelEdit}
											>{m.common_cancel()}</Button
										>
									</form>
								{:else}
									<div class="flex flex-1 items-center gap-2">
										{#if category.meals.length > 0}
											<button
												type="button"
												onclick={() => toggleCategory(category.id)}
												class="flex items-center justify-center rounded-sm p-1 transition-colors hover:bg-accent"
											>
												{#if expandedCategories.has(category.id)}
													<ChevronDown class="h-4 w-4" />
												{:else}
													<ChevronRight class="h-4 w-4" />
												{/if}
											</button>
										{:else}
											<div class="w-6"></div>
										{/if}
										<span class="font-medium">{category.name}</span>
										{#if category.meals.length > 0}
											<Badge variant="secondary" class="text-xs">
												{category.meals.length === 1
													? m.categories_mealCount_one({ count: category.meals.length })
													: m.categories_mealCount_other({ count: category.meals.length })}
											</Badge>
										{/if}
									</div>
									<div class="flex gap-1">
										<Button
											size="icon"
											variant="ghost"
											class="h-8 w-8"
											onclick={() => startEdit(category)}
										>
											<Edit class="h-4 w-4" />
										</Button>
										<Button
											size="icon"
											variant="ghost"
											class="h-8 w-8 text-destructive hover:text-destructive"
											onclick={() => (deleteCategoryId = category.id)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								{/if}
							</div>
							{#if !editingCategory || editingCategory?.id !== category.id}
								<Collapsible.Root open={expandedCategories.has(category.id)}>
									<Collapsible.Content>
										{#if category.meals.length > 0}
											<div class="ml-8 mt-2 space-y-1">
												{#each category.meals as meal}
													<button
														type="button"
														onclick={() => goto(`/meals/${meal.id}`)}
														class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
													>
														<ChefHat class="h-4 w-4 text-muted-foreground" />
														<span class="flex-1">{meal.title}</span>
													</button>
												{/each}
											</div>
										{:else}
											<div class="ml-8 mt-2 text-sm text-muted-foreground">
												{m.categories_noMeals()}
											</div>
										{/if}
									</Collapsible.Content>
								</Collapsible.Root>
							{/if}
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent class="py-12">
				<div class="text-center">
					<p class="mb-4 text-muted-foreground">{m.categories_noCategoriesYet()}</p>
					<Button onclick={() => (showAddDialog = true)}>
						<Plus class="mr-2 h-4 w-4" />
						{m.categories_addCategory()}
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

<Dialog.Root bind:open={showAddDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{m.categories_addCategory()}</Dialog.Title>
		</Dialog.Header>
		<form
			method="POST"
			action="?/create"
			use:enhance={({ formData }) => {
				formData.append('name', newCategoryName.trim());

				return async ({ result }) => {
					if (result.type === 'success') {
						newCategoryName = '';
						showAddDialog = false;
					} else if (result.type === 'failure') {
						alert(result.data?.error || m.categories_failedToCreate());
					}
				};
			}}
		>
			<div class="space-y-4">
				<div>
					<Label for="categoryName">{m.categories_categoryName()}</Label>
					<Input
						id="categoryName"
						type="text"
						placeholder={m.categories_categoryNamePlaceholder()}
						bind:value={newCategoryName}
						class="mt-2"
					/>
				</div>
				<div class="flex justify-end gap-2">
					<Dialog.Close>
						<Button
							type="button"
							variant="outline"
							onclick={() => {
								newCategoryName = '';
							}}>{m.common_cancel()}</Button
						>
					</Dialog.Close>
					<Button type="submit">{m.common_add()}</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root open={deleteCategoryId !== null}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{m.categories_deleteTitle()}</AlertDialog.Title>
			<AlertDialog.Description>
				{m.categories_deleteDescription()}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>
				<Button variant="outline" onclick={() => (deleteCategoryId = null)}>{m.common_cancel()}</Button>
			</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				use:enhance={({ formData }) => {
					if (deleteCategoryId) {
						formData.append('id', deleteCategoryId);
					}

					return async ({ result }) => {
						if (result.type === 'success') {
							deleteCategoryId = null;
						} else if (result.type === 'failure') {
							alert(result.data?.error || m.categories_failedToDelete());
						}
					};
				}}
			>
				<AlertDialog.Action>
					<Button type="submit" variant="destructive">{m.common_delete()}</Button>
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
