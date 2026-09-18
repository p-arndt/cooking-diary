<script lang="ts">
	import { ImagePlus, X } from '@lucide/svelte';

	type Props = {
		id: string;
		preview: string | null;
		label: string;
		hint?: string;
		alt: string;
		onChange: (e: Event) => void;
		onRemove: () => void;
	};

	let { id, preview, label, hint, alt, onChange, onRemove }: Props = $props();
</script>

{#if preview}
	<div class="relative overflow-hidden rounded-3xl border bg-secondary">
		<img src={preview} {alt} class="aspect-video w-full object-cover" />
		<button
			type="button"
			onclick={onRemove}
			class="absolute top-3 right-3 rounded-full bg-black/45 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/60"
			aria-label={label}
		>
			<X class="size-4" />
		</button>
	</div>
{:else}
	<label
		for={id}
		class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed bg-secondary/40 px-6 py-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
	>
		<span class="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
			<ImagePlus class="size-6" />
		</span>
		<span class="text-sm font-semibold">{label}</span>
		{#if hint}
			<span class="text-xs text-muted-foreground">{hint}</span>
		{/if}
	</label>
{/if}
<input {id} type="file" accept="image/*" class="sr-only" onchange={onChange} />
