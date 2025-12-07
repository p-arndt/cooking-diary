<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { ChefHat, LayoutDashboard, Settings, TextAlignJustify, TrendingUp } from '@lucide/svelte';

	type NavItem = {
		title: string;
		url: string;
		icon?: any;
		isActive?: boolean;
	};

	let items: NavItem[] = $state([
		{
			title: m.nav_dashboard(),
			url: '/',
			icon: LayoutDashboard,
			isActive: isActive('/')
		},
		{
			title: m.nav_meals(),
			url: '/meals',
			icon: ChefHat,
			isActive: isActive('/meals')
		},
		{
			title: m.nav_categories(),
			url: '/categories',
			icon: TextAlignJustify,
			isActive: isActive('/categories')
		},
		{
			title: m.nav_analytics(),
			url: '/analytics',
			icon: TrendingUp,
			isActive: isActive('/analytics')
		},
		{
			title: m.nav_settings(),
			url: '/settings',
			icon: Settings,
			isActive: isActive('/settings')
		}
	]);

	async function handleClick(url: string) {
		await goto(url);
	}

	function isActive(href: string) {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(href);
	}
</script>

<nav
	class="fixed right-0 bottom-0 left-0 z-50 border-t bg-background/95 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden"
>
	<div class="flex h-16 items-center justify-around">
		{#each items as item (item.title)}
			{@const active = isActive(item.url)}
			<button
				onclick={() => handleClick(item.url)}
				class={[
					'flex min-w-[60px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200',
					active
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground active:bg-accent active:text-foreground'
				]}
				aria-label={item.title}
				aria-current={active ? 'page' : undefined}
			>
				{#if item.icon}
					<item.icon class={['h-5 w-5 transition-transform', active ? 'scale-110' : 'scale-100']} />
				{/if}
				<span
					class={['text-xs font-medium transition-all', active ? 'font-semibold' : 'font-normal']}
				>
					{item.title}
				</span>
			</button>
		{/each}
	</div>
</nav>
