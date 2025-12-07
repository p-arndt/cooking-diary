<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import BottomTabBar from '$lib/components/bottom-tab-bar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { page } from '$app/state';
	import { LayoutDashboard, ChefHat, TextAlignJustify, Settings, TrendingUp } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import '../../app.css';
	import type { LayoutData } from './$types';

	type Props = {
		data: LayoutData;
		children: any;
	};

	let { data, children }: Props = $props();

	let isSidebarOpen = $state(false);
	const isMobile = new IsMobile();
</script>

<Sidebar.Provider bind:open={isSidebarOpen}>
	<AppSidebar {data} />
	<Sidebar.Inset>
		{#if !isSidebarOpen && !isMobile.current}
			<header
				class="flex h-10 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-10"
			>
				<div class="flex items-center gap-2 px-4">
					<Sidebar.Trigger class="transition-all duration-300 ease-linear" />
				</div>
			</header>
		{/if}

		<div class="flex flex-1 flex-col">
			<main class="container mx-auto flex-1 overflow-y-auto pb-16 md:pb-0">
				{@render children()}
			</main>
		</div>
	</Sidebar.Inset>
	{#if isMobile.current}
		<BottomTabBar />
	{/if}
</Sidebar.Provider>
