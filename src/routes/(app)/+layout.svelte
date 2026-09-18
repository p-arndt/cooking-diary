<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import BottomTabBar from '$lib/components/bottom-tab-bar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import '../../app.css';
	import type { LayoutData } from './$types';

	type Props = {
		data: LayoutData;
		children: any;
	};

	let { data, children }: Props = $props();

	const isMobile = new IsMobile();
</script>

<Sidebar.Provider>
	<AppSidebar {data} variant="inset" />
	<Sidebar.Inset class="md:peer-data-[variant=inset]:shadow-soft">
		{#if !isMobile.current}
			<header class="flex h-12 shrink-0 items-center px-3">
				<Sidebar.Trigger class="rounded-full" />
			</header>
		{/if}

		<main class="flex-1 pb-28 md:pb-10">
			{@render children()}
		</main>
	</Sidebar.Inset>
	{#if isMobile.current}
		<BottomTabBar />
	{/if}
</Sidebar.Provider>
