<script lang="ts">
	import { page } from '$app/state';
	import cookindiarylogo from '$lib/assets/logo.png';
	import NavMain from '$lib/components/nav-main.svelte';
	import NavUser from '$lib/components/nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { LayoutDashboard, Heart, Users, ChefHat, TextAlignJustify, Settings, TrendingUp } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { ComponentProps } from 'svelte';

	type LayoutData = {
		user?: {
			name: string;
			email: string;
			image?: string | null;
			isAdmin?: boolean;
		};
		version?: string;
	};

	type Props = {
		data: LayoutData;
		ref?: ComponentProps<typeof Sidebar.Root>['ref'];
		collapsible?: ComponentProps<typeof Sidebar.Root>['collapsible'];
	};

	let { data, ref = $bindable(null), collapsible = 'icon', ...restProps }: Props = $props();

	const sidebar = useSidebar();

	function isActive(href: string) {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(href);
	}

	const navigation = $derived([
		{
			title: m.nav_dashboard(),
			url: '/',
			icon: LayoutDashboard,
			isActive: isActive('/'),
			items: []
		},
		{
			title: m.nav_meals(),
			url: '/meals',
			icon: ChefHat,
			isActive: isActive('/meals'),
			items: []
		},
		{
			title: m.nav_categories(),
			url: '/categories',
			icon: TextAlignJustify,
			isActive: isActive('/categories'),
			items: []
		},
		{
			title: m.nav_analytics(),
			url: '/analytics',
			icon: TrendingUp,
			isActive: isActive('/analytics'),
			items: []
		},
		{
			title: m.nav_settings(),
			url: '/settings',
			icon: Settings,
			isActive: isActive('/settings'),
			items: []
		}
	]);
</script>

<Sidebar.Root {collapsible} bind:ref {...restProps}>
	<Sidebar.Header>
		<div
			class="flex items-center {sidebar.open
				? 'justify-start'
				: 'justify-center'} gap-4 p-1 transition-all duration-300 ease-linear"
		>
			<img src={cookindiarylogo} alt="{m.common_appName()} logo" class="max-w-9" />
			<h1 class="text-xl font-bold {sidebar.open ? 'block' : 'hidden'}">{m.common_appName()}</h1>
		</div>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={navigation} />
	</Sidebar.Content>
	<Sidebar.Footer>
		{#if data.user}
			<NavUser user={data.user} />
		{/if}
	</Sidebar.Footer>
</Sidebar.Root>
