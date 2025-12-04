<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { X } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';

	type Category = {
		id: string;
		name: string;
	};

	type Props = {
		categories: Category[];
		selectedCategoryIds: string[];
		onChange: (categoryIds: string[]) => void;
		onCreateCategory?: (name: string) => Promise<Category | null>;
		placeholder?: string;
	};

	let {
		categories,
		selectedCategoryIds,
		onChange,
		onCreateCategory,
		placeholder = m.meals_form_categoriesPlaceholder()
	}: Props = $props();

	let inputValue = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);
	let showSuggestions = $state(false);
	let isCreating = $state(false);
	let highlightedIndex = $state(-1);

	const selectedCategories = $derived(categories.filter((c) => selectedCategoryIds.includes(c.id)));

	const filteredCategories = $derived.by(() => {
		const unselected = categories.filter((c) => !selectedCategoryIds.includes(c.id));

		if (!inputValue.trim()) {
			return unselected;
		}

		const query = inputValue.toLowerCase();
		return unselected.filter((c) => c.name.toLowerCase().includes(query));
	});

	const hasExactMatch = $derived(
		categories.some((c) => c.name.toLowerCase() === inputValue.toLowerCase().trim())
	);

	const showCreateOption = $derived(inputValue.trim() && !hasExactMatch && onCreateCategory);

	function removeCategory(categoryId: string) {
		onChange(selectedCategoryIds.filter((id) => id !== categoryId));
	}

	async function addCategory(categoryId: string) {
		if (!selectedCategoryIds.includes(categoryId)) {
			onChange([...selectedCategoryIds, categoryId]);
			inputValue = '';
			showSuggestions = false;
			highlightedIndex = -1;
			inputRef?.focus();
		}
	}

	async function createAndAddCategory(name?: string) {
		const categoryName = (name || inputValue).trim();
		if (!categoryName || isCreating || !onCreateCategory) return;

		const existing = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
		if (existing) {
			await addCategory(existing.id);
			return;
		}

		isCreating = true;
		try {
			const newCategory = await onCreateCategory(categoryName);
			if (newCategory) {
				onChange([...selectedCategoryIds, newCategory.id]);
				inputValue = '';
				showSuggestions = false;
				highlightedIndex = -1;
				inputRef?.focus();
			}
		} catch (error) {
			console.error('Error creating category:', error);
		} finally {
			isCreating = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (highlightedIndex >= 0 && highlightedIndex < filteredCategories.length) {
				addCategory(filteredCategories[highlightedIndex].id);
			} else if (showCreateOption && highlightedIndex === filteredCategories.length) {
				createAndAddCategory();
			} else if (inputValue.trim() && filteredCategories.length === 0) {
				createAndAddCategory();
			} else if (filteredCategories.length > 0) {
				addCategory(filteredCategories[0].id);
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			const maxIndex = filteredCategories.length + (showCreateOption ? 1 : 0) - 1;
			highlightedIndex = highlightedIndex < maxIndex ? highlightedIndex + 1 : 0;
			showSuggestions = true;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			const maxIndex = filteredCategories.length + (showCreateOption ? 1 : 0) - 1;
			highlightedIndex = highlightedIndex > 0 ? highlightedIndex - 1 : maxIndex;
			showSuggestions = true;
		} else if (e.key === 'Escape') {
			showSuggestions = false;
			highlightedIndex = -1;
		} else if (e.key === 'Backspace' && !inputValue && selectedCategories.length > 0) {
			removeCategory(selectedCategories[selectedCategories.length - 1].id);
		} else {
			highlightedIndex = -1;
			showSuggestions = true;
		}
	}

	function handleInputFocus() {
		showSuggestions = true;
	}

	function handleInputBlur() {
		setTimeout(() => {
			showSuggestions = false;
			highlightedIndex = -1;
		}, 200);
	}
</script>

<div class="space-y-2">
	<div
		class="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs ring-offset-background transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 md:text-sm dark:bg-input/30"
	>
		{#each selectedCategories as category}
			<Badge class="gap-1 px-2 py-0.5 text-xs font-medium">
				{category.name}
				<button
					type="button"
					class="ml-0.5 rounded-sm p-0.5 transition-colors hover:bg-muted/80"
					onclick={(e) => {
						e.stopPropagation();
						removeCategory(category.id);
					}}
					onmousedown={(e) => e.preventDefault()}
				>
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/each}
		<div class="relative min-w-[120px] flex-1">
			<input
				bind:this={inputRef}
				bind:value={inputValue}
				onkeydown={handleKeydown}
				onfocus={handleInputFocus}
				onblur={handleInputBlur}
				oninput={() => {
					showSuggestions = true;
					highlightedIndex = -1;
				}}
				placeholder={selectedCategories.length === 0 ? placeholder : ''}
				disabled={isCreating}
				class="w-full border-0 bg-transparent p-0 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
			/>
			{#if showSuggestions && (filteredCategories.length > 0 || showCreateOption)}
				<div
					class="absolute top-full z-50 mt-1.5 max-h-[300px] w-full overflow-auto rounded-md border bg-popover shadow-lg"
				>
					<div class="p-1">
						{#if filteredCategories.length > 0}
							{#each filteredCategories as category, index}
								<button
									type="button"
									class="w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground {highlightedIndex ===
									index
										? 'bg-accent text-accent-foreground'
										: ''}"
									onclick={() => addCategory(category.id)}
									onmouseenter={() => (highlightedIndex = index)}
									onmousedown={(e) => e.preventDefault()}
								>
									{category.name}
								</button>
							{/each}
						{/if}
						{#if showCreateOption}
							{#if filteredCategories.length > 0}
								<div class="my-1 h-px bg-border"></div>
							{/if}
							<button
								type="button"
								class="w-full rounded-sm px-2 py-1.5 text-left text-sm font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground {highlightedIndex ===
								filteredCategories.length
									? 'bg-accent text-accent-foreground'
									: ''}"
								onclick={() => createAndAddCategory()}
								onmouseenter={() => (highlightedIndex = filteredCategories.length)}
								onmousedown={(e) => e.preventDefault()}
							>
								<span class="mr-1">+</span>
								{m.categories_create({ name: inputValue.trim() })}
							</button>
						{/if}
						{#if filteredCategories.length === 0 && !showCreateOption && !inputValue.trim()}
							<div class="px-2 py-1.5 text-sm text-muted-foreground">{m.categories_noCategoriesAvailable()}</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
