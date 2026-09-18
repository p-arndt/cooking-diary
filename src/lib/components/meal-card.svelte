<script lang="ts">
	import { ChefHat, Clock, Flame } from '@lucide/svelte';

	type Meal = {
		id: string;
		title: string;
		defaultPhotoUrl: string | null;
		prepTime?: string | null;
		cookTime?: string | null;
		categories: Array<{ id: string; name: string }>;
	};

	let { meal }: { meal: Meal } = $props();

	const chipClass = $derived([
		'flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold backdrop-blur-md',
		meal.defaultPhotoUrl ? 'bg-black/35 text-white' : 'bg-card/80 text-foreground'
	]);
</script>

<a
	href="/meals/{meal.id}"
	class="group relative block aspect-square overflow-hidden rounded-3xl bg-secondary shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lifted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:aspect-[4/3]"
>
	{#if meal.defaultPhotoUrl}
		<img
			src={meal.defaultPhotoUrl}
			alt=""
			loading="lazy"
			class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
		/>
	{:else}
		<div class="absolute inset-0 flex items-start justify-end bg-gradient-to-br from-primary/35 via-primary/15 to-accent/25 p-4">
			<ChefHat class="size-16 rotate-[-10deg] text-primary/60" />
		</div>
	{/if}

	{#if meal.prepTime || meal.cookTime}
		<div class="absolute top-3 left-3 flex gap-1.5">
			{#if meal.prepTime}
				<span class={chipClass}>
					<Clock class="size-3" />
					{meal.prepTime}
				</span>
			{/if}
			{#if meal.cookTime}
				<span class={chipClass}>
					<Flame class="size-3" />
					{meal.cookTime}
				</span>
			{/if}
		</div>
	{/if}

	<div
		class={[
			'absolute inset-x-2 bottom-2 rounded-2xl border p-3 backdrop-blur-md',
			meal.defaultPhotoUrl ? 'border-white/15 bg-black/40 text-white' : 'border-border/60 bg-card/85 text-foreground'
		]}
	>
		<h3 class="line-clamp-2 leading-tight font-bold">{meal.title}</h3>
		{#if meal.categories.length > 0}
			<p class={['mt-0.5 truncate text-xs font-medium', meal.defaultPhotoUrl ? 'text-white/75' : 'text-muted-foreground']}>
				{meal.categories.map((c) => c.name).join(' · ')}
			</p>
		{/if}
	</div>
</a>
