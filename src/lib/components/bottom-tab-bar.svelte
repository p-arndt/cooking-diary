<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { BookOpen, ChefHat, Plus, Settings, TrendingUp } from '@lucide/svelte';

	const leftItems = $derived([
		{ title: m.nav_dashboard(), url: '/', icon: BookOpen },
		{ title: m.nav_meals(), url: '/meals', icon: ChefHat }
	]);

	const rightItems = $derived([
		{ title: m.nav_analytics(), url: '/analytics', icon: TrendingUp },
		{ title: m.nav_settings(), url: '/settings', icon: Settings }
	]);

	function isActive(href: string) {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		// Categories live under the meals tab on mobile
		if (href === '/meals' && page.url.pathname.startsWith('/categories')) {
			return true;
		}
		return page.url.pathname.startsWith(href);
	}
</script>

{#snippet tab(item: { title: string; url: string; icon: typeof BookOpen })}
	{@const active = isActive(item.url)}
	<a
		href={item.url}
		class={[
			'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium transition-colors',
			active ? 'text-primary' : 'text-background/60 hover:text-background dark:text-foreground/55'
		]}
		aria-current={active ? 'page' : undefined}
	>
		<item.icon class="size-5" strokeWidth={active ? 2.4 : 2} />
		<span>{item.title}</span>
	</a>
{/snippet}

<nav
	class="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
	aria-label={m.nav_navigation()}
>
	<div
		class="mx-auto flex h-16 max-w-md items-center gap-1 rounded-full bg-foreground px-2 shadow-lifted dark:border dark:border-border dark:bg-card"
	>
		{#each leftItems as item (item.url)}
			{@render tab(item)}
		{/each}

		<a
			href="/entries/add"
			class="-mt-7 flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lifted ring-4 ring-background transition-transform active:scale-95"
			aria-label={m.diary_addEntry()}
		>
			<Plus class="size-6" strokeWidth={2.6} />
		</a>

		{#each rightItems as item (item.url)}
			{@render tab(item)}
		{/each}
	</div>
</nav>
