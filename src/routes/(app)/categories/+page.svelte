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
	import * as m from '$lib/paraglide/messages.js';

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
						<div class="flex items-center justify-between px-4 py-3">
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
								<span class="font-medium">{category.name}</span>
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
