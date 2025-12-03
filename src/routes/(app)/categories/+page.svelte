<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Plus, Edit, Trash2 } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	let { data }: { data: PageData } = $props();

	let editingCategory = $state<{ id: string; name: string } | null>(null);
	let editingName = $state('');
	let deleteCategoryId = $state<string | null>(null);
	let newCategoryName = $state('');
	let showAddDialog = $state(false);

	function startEdit(category: { id: string; name: string }) {
		editingCategory = category;
		editingName = category.name;
	}

	function cancelEdit() {
		editingCategory = null;
		editingName = '';
	}
</script>

<svelte:head>
	<title>Categories - Cooking Diary</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold tracking-tight">Categories</h1>
			<p class="text-muted-foreground mt-1">Manage your meal categories</p>
		</div>
		<Button onclick={() => (showAddDialog = true)}>
			<Plus class="mr-2 h-4 w-4" />
			Add Category
		</Button>
	</div>

	<!-- Categories List -->
	{#if data.categories.length > 0}
		<div class="space-y-2">
			{#each data.categories as category}
				<Card>
					<CardContent class="pt-6">
						{#if editingCategory?.id === category.id}
							<!-- Edit Mode -->
							<form
								method="POST"
								action="?/edit"
								class="flex items-center gap-2"
								use:enhance={({ formData }) => {
									formData.append('id', category.id);
									formData.append('name', editingName.trim());

									return async ({ result }) => {
										if (result.type === 'success') {
											cancelEdit();
										} else if (result.type === 'failure') {
											alert(result.data?.error || 'Failed to update category');
										}
									};
								}}
							>
								<Input bind:value={editingName} class="flex-1" />
								<Button type="submit" size="sm">Save</Button>
								<Button type="button" size="sm" variant="outline" onclick={cancelEdit}>Cancel</Button>
							</form>
						{:else}
							<!-- View Mode -->
							<div class="flex items-center justify-between">
								<span class="text-lg font-medium">• {category.name}</span>
								<div class="flex gap-2">
									<Button
										size="sm"
										variant="ghost"
										onclick={() => startEdit(category)}
									>
										<Edit class="h-4 w-4" />
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onclick={() => (deleteCategoryId = category.id)}
									>
										<Trash2 class="h-4 w-4 text-destructive" />
									</Button>
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<Card>
			<CardContent class="pt-6">
				<div class="text-center py-12">
					<p class="text-muted-foreground mb-4">No categories yet. Create your first one!</p>
					<Button onclick={() => (showAddDialog = true)}>
						<Plus class="mr-2 h-4 w-4" />
						Add Category
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

<!-- Add Category Dialog -->
<Dialog.Root bind:open={showAddDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add Category</Dialog.Title>
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
						alert(result.data?.error || 'Failed to create category');
					}
				};
			}}
		>
			<div class="space-y-4">
				<div>
					<Label for="categoryName">Category Name</Label>
					<Input
						id="categoryName"
						type="text"
						placeholder="e.g., Pasta, Vegan, Dessert"
						bind:value={newCategoryName}
						class="mt-2"
					/>
				</div>
				<div class="flex justify-end gap-2">
					<Dialog.Close>
						<Button type="button" variant="outline" onclick={() => { newCategoryName = ''; }}>Cancel</Button>
					</Dialog.Close>
					<Button type="submit">Add</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root open={deleteCategoryId !== null}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Category</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete this category? This will remove it from all meals, but won't delete the meals themselves.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>
				<Button variant="outline" onclick={() => (deleteCategoryId = null)}>Cancel</Button>
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
							alert(result.data?.error || 'Failed to delete category');
						}
					};
				}}
			>
				<AlertDialog.Action>
					<Button type="submit" variant="destructive">Delete</Button>
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

