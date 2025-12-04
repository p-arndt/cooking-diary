<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Pencil, Trash2, MoreVertical } from '@lucide/svelte';
	import { ChefHat } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import QuickAddEntryDialog from '$lib/components/quick-add-entry-dialog.svelte';
	import * as m from '$lib/paraglide/messages.js';

	type Meal = {
		id: string;
		title: string;
		defaultPhotoUrl: string | null;
		categories: Array<{ id: string; name: string }>;
	};

	type Entry = {
		id: string;
		meal: Meal;
		notes: string | null;
		photoUrls: string[] | null;
		dateCooked: Date | string;
	};

	type Props = {
		entry?: Entry;
		meal?: Meal;
		onclick?: () => void;
		meals?: Array<{
			id: string;
			title: string;
			categories: Array<{ id: string; name: string }>;
			defaultPhotoUrl: string | null;
		}>;
	};

	let { entry, meal, onclick, meals = [] }: Props = $props();

	const displayMeal = $derived(entry?.meal || meal);
	const photoUrl = $derived(entry?.photoUrls?.[0] || displayMeal?.defaultPhotoUrl);
	const notes = $derived(entry?.notes);

	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let isSubmitting = $state(false);

	async function deleteEntry() {
		if (!entry) return;

		isSubmitting = true;
		try {
			const response = await fetch('/api/entries', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: entry.id })
			});

			if (response.ok) {
				showDeleteDialog = false;
				await invalidateAll();
			} else {
				const error = await response.json();
				alert(error.error || m.entries_failedToDelete());
			}
		} catch (error) {
			console.error('Error deleting entry:', error);
			alert(m.entries_failedToDelete());
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card class={onclick ? 'cursor-pointer transition-all hover:shadow-md' : ''} {onclick}>
	<CardContent>
		<div class="flex items-start gap-4">
			{#if photoUrl}
				<div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
					<img src={photoUrl} alt={displayMeal?.title} class="h-full w-full object-cover" />
				</div>
			{:else}
				<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
					<ChefHat class="h-8 w-8 text-muted-foreground" />
				</div>
			{/if}
			<div class="flex-1">
				<div class="flex items-start justify-between gap-2">
					<div class="flex-1">
						<h3 class="font-semibold">{displayMeal?.title}</h3>
						{#if displayMeal && displayMeal.categories.length > 0}
							<div class="mt-1 flex flex-wrap gap-1">
								{#each displayMeal.categories as category}
									<Badge variant="secondary" class="text-xs">
										{category.name}
									</Badge>
								{/each}
							</div>
						{/if}
						{#if notes}
							<p class="mt-2 text-sm text-muted-foreground">{notes}</p>
						{/if}
					</div>
					{#if entry}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<MoreVertical class="h-4 w-4" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								<DropdownMenu.Item
									onclick={(e) => {
										e.stopPropagation();
										showEditDialog = true;
									}}
								>
									<Pencil class="mr-2 h-4 w-4" />
									{m.entries_edit()}
								</DropdownMenu.Item>
								<DropdownMenu.Item
									variant="destructive"
									onclick={(e) => {
										e.stopPropagation();
										showDeleteDialog = true;
									}}
								>
									<Trash2 class="mr-2 h-4 w-4" />
									{m.entries_delete()}
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{/if}
				</div>
			</div>
		</div>
	</CardContent>
</Card>

{#if entry && meals.length > 0}
	<QuickAddEntryDialog {meals} bind:open={showEditDialog} {entry} />
{/if}

<AlertDialog.Root open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{m.entries_deleteTitle()}</AlertDialog.Title>
			<AlertDialog.Description>
				{m.entries_deleteDescription()}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (showDeleteDialog = false)} disabled={isSubmitting}>
				{m.common_cancel()}
			</AlertDialog.Cancel>
			<AlertDialog.Action onclick={deleteEntry} disabled={isSubmitting}>
				{m.common_delete()}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

{#if entry && meals.length > 0}
	<QuickAddEntryDialog {meals} bind:open={showEditDialog} {entry} />
{/if}
