<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { ArrowLeft, ChefHat, ChevronDown, Pencil, Plus, Tags, Trash2 } from '@lucide/svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as m from '$lib/paraglide/messages.js';

	let { data }: { data: PageData } = $props();

	let editingCategory = $state<{ id: string; name: string } | null>(null);
	let editingName = $state('');
	let deleteCategoryId = $state<string | null>(null);
	let newCategoryName = $state('');
	let showAddDialog = $state(false);
	const expandedCategories = new SvelteSet<string>();

	const tints = [
		'bg-primary/15 text-primary',
		'bg-accent/15 text-accent',
		'bg-chart-2/15 text-chart-2',
		'bg-chart-4/15 text-chart-4',
		'bg-chart-5/15 text-chart-5'
	];

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
	}
</script>

<svelte:head>
	<title>{m.categories_pageTitle()}</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6 px-4 pt-6 md:px-8 md:pt-2">
	<a
		href={resolve('/meals')}
		class="inline-flex items-center gap-2 rounded-full bg-secondary py-1.5 pr-4 pl-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70 md:hidden"
	>
		<ArrowLeft class="size-4" />
		{m.meals_backToMeals()}
	</a>

	<PageHeader title={m.categories_title()} subtitle={m.categories_subtitle()}>
		{#snippet actions()}
			<Button
				onclick={() => (showAddDialog = true)}
				size="icon"
				class="md:hidden"
				aria-label={m.categories_addCategory()}
			>
				<Plus />
			</Button>
			<Button onclick={() => (showAddDialog = true)} class="hidden md:inline-flex">
				<Plus />
				{m.categories_addCategory()}
			</Button>
		{/snippet}
	</PageHeader>

	{#if data.categories.length > 0}
		<div class="space-y-3">
			{#each data.categories as category, index (category.id)}
				{@const expanded = expandedCategories.has(category.id)}
				<div class="rounded-3xl border border-border/60 bg-card p-3 shadow-soft">
					<div class="flex items-center gap-3">
						{#if editingCategory?.id === category.id}
							<form
								method="POST"
								action="?/edit"
								class="flex flex-1 flex-wrap items-center gap-2"
								use:enhance={({ formData }) => {
									formData.append('id', category.id);
									formData.append('name', editingName.trim());

									return async ({ result, update }) => {
										if (result.type === 'success') {
											await update();
											cancelEdit();
										} else if (result.type === 'failure') {
											alert(result.data?.error || m.categories_failedToUpdate());
										}
									};
								}}
							>
								<Input bind:value={editingName} class="min-w-40 flex-1" />
								<Button type="submit">{m.common_save()}</Button>
								<Button type="button" variant="outline" onclick={cancelEdit}
									>{m.common_cancel()}</Button
								>
							</form>
						{:else}
							<button
								type="button"
								onclick={() => category.meals.length > 0 && toggleCategory(category.id)}
								class="flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-left touch-manipulation"
								aria-expanded={category.meals.length > 0 ? expanded : undefined}
							>
								<span
									class={[
										'flex size-11 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold uppercase',
										tints[index % tints.length]
									]}
								>
									{category.name.charAt(0)}
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate font-bold">{category.name}</span>
									<span class="block text-xs font-medium text-muted-foreground">
										{category.meals.length === 1
											? m.categories_mealCount_one({ count: category.meals.length })
											: m.categories_mealCount_other({ count: category.meals.length })}
									</span>
								</span>
								{#if category.meals.length > 0}
									<ChevronDown
										class={[
											'size-5 shrink-0 text-muted-foreground transition-transform',
											expanded && 'rotate-180'
										]}
									/>
								{/if}
							</button>
							<div class="flex shrink-0 gap-1">
								<Button
									size="icon"
									variant="ghost"
									class="touch-manipulation"
									onclick={() => startEdit(category)}
									aria-label={m.common_edit()}
								>
									<Pencil />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									class="text-destructive hover:text-destructive touch-manipulation"
									onclick={() => (deleteCategoryId = category.id)}
									aria-label={m.common_delete()}
								>
									<Trash2 />
								</Button>
							</div>
						{/if}
					</div>
					{#if !editingCategory || editingCategory?.id !== category.id}
						<Collapsible.Root open={expanded}>
							<Collapsible.Content>
								<div class="mt-3 flex flex-wrap gap-2 border-t border-dashed pt-3">
									{#each category.meals as meal (meal.id)}
										<a
											href={resolve('/(app)/meals/[id]', { id: meal.id })}
											class="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-primary/15"
										>
											<ChefHat class="size-3.5 text-primary" />
											{meal.title}
										</a>
									{:else}
										<p class="text-sm text-muted-foreground">{m.categories_noMeals()}</p>
									{/each}
								</div>
							</Collapsible.Content>
						</Collapsible.Root>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div
			class="flex flex-col items-center rounded-3xl border-2 border-dashed px-6 py-14 text-center"
		>
			<div class="mb-4 flex size-16 items-center justify-center rounded-3xl bg-primary/15">
				<Tags class="size-8 text-primary" />
			</div>
			<p class="max-w-xs text-muted-foreground">{m.categories_noCategoriesYet()}</p>
			<Button class="mt-5" onclick={() => (showAddDialog = true)}>
				<Plus />
				{m.categories_addCategory()}
			</Button>
		</div>
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

				return async ({ result, update }) => {
					if (result.type === 'success') {
						await update();
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
				<Button variant="outline" onclick={() => (deleteCategoryId = null)}
					>{m.common_cancel()}</Button
				>
			</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				use:enhance={({ formData }) => {
					if (deleteCategoryId) {
						formData.append('id', deleteCategoryId);
					}

					return async ({ result, update }) => {
						if (result.type === 'success') {
							await update();
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
