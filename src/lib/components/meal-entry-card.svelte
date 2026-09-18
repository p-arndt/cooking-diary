<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { ChefHat, MoreVertical, Pencil, Trash2 } from '@lucide/svelte';
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

<div
	class={[
		'group relative flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-3 shadow-soft transition-all',
		onclick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lifted'
	]}
	role={onclick ? 'button' : undefined}
	tabindex={onclick ? 0 : undefined}
	{onclick}
	onkeydown={(e) => onclick && (e.key === 'Enter' || e.key === ' ') && onclick()}
>
	<div class="size-20 shrink-0 overflow-hidden rounded-2xl bg-secondary">
		{#if photoUrl}
			<img
				src={photoUrl}
				alt={displayMeal?.title}
				loading="lazy"
				class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
			/>
		{:else}
			<div class="flex size-full items-center justify-center bg-gradient-to-br from-primary/25 to-accent/15">
				<ChefHat class="size-8 text-primary" />
			</div>
		{/if}
	</div>

	<div class="min-w-0 flex-1 py-1">
		<h3 class="truncate text-base font-bold">{displayMeal?.title}</h3>
		{#if displayMeal && displayMeal.categories.length > 0}
			<div class="mt-1.5 flex flex-wrap gap-1">
				{#each displayMeal.categories.slice(0, 3) as category (category.id)}
					<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
						{category.name}
					</span>
				{/each}
			</div>
		{/if}
		{#if notes}
			<p class="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{notes}</p>
		{/if}
	</div>

	{#if entry}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="self-start rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
				aria-label={m.entries_edit()}
			>
				<MoreVertical class="size-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="rounded-2xl">
				<DropdownMenu.Item
					class="rounded-xl"
					onclick={(e) => {
						e.stopPropagation();
						showEditDialog = true;
					}}
				>
					<Pencil class="mr-2 size-4" />
					{m.entries_edit()}
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="rounded-xl"
					variant="destructive"
					onclick={(e) => {
						e.stopPropagation();
						showDeleteDialog = true;
					}}
				>
					<Trash2 class="mr-2 size-4" />
					{m.entries_delete()}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}
</div>

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
