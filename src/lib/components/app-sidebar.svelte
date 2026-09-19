<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import cookindiarylogo from '$lib/assets/logo.png';
	import NavMain from '$lib/components/nav-main.svelte';
	import NavUser from '$lib/components/nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { BookOpen, ChefHat, Settings, Tags, TrendingUp } from '@lucide/svelte';
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
		variant?: ComponentProps<typeof Sidebar.Root>['variant'];
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
			url: resolve('/'),
			icon: BookOpen,
			isActive: isActive('/'),
			items: []
		},
		{
			title: m.nav_meals(),
			url: resolve('/meals'),
			icon: ChefHat,
			isActive: isActive('/meals'),
			items: []
		},
		{
			title: m.nav_categories(),
			url: resolve('/categories'),
			icon: Tags,
			isActive: isActive('/categories'),
			items: []
		},
		{
			title: m.nav_analytics(),
			url: resolve('/analytics'),
			icon: TrendingUp,
			isActive: isActive('/analytics'),
			items: []
		},
		{
			title: m.nav_settings(),
			url: resolve('/settings'),
			icon: Settings,
			isActive: isActive('/settings'),
			items: []
		}
	]);
</script>

<Sidebar.Root {collapsible} bind:ref {...restProps}>
	<Sidebar.Header>
		<div class="flex items-center gap-3 p-1 {sidebar.open ? 'justify-start' : 'justify-center'}">
			<img
				src={cookindiarylogo}
				alt="{m.common_appName()} logo"
				class="size-9 rounded-xl bg-primary/15 p-1"
			/>
			<span class="text-lg font-extrabold tracking-tight {sidebar.open ? 'block' : 'hidden'}">
				{m.common_appName()}
			</span>
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
