<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import DarkModeToggle from '$lib/components/common/dark-mode-toggle.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import '../../app.css';
	import type { LayoutData } from './$types';

	type Props = {
		data: LayoutData;
		children: any;
	};

	let { data, children }: Props = $props();

	let isSidebarOpen = $state(false);
</script>

<Sidebar.Provider bind:open={isSidebarOpen}>
	<AppSidebar {data} />
	<Sidebar.Inset>
		<header
			class="flex h-10 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-10"
		>
			<div class="flex items-center gap-2 px-4">
				{#if !isSidebarOpen}
					<Sidebar.Trigger class="transition-all duration-300 ease-linear" />
				{/if}
			</div>
		</header>

		<div class="flex flex-1 flex-col">
			<main class="container mx-auto flex-1 overflow-y-auto">
				{@render children()}
			</main>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
