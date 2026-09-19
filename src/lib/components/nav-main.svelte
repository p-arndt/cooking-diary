<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ResolvedPathname } from '$app/types';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import type { LucideIcon } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';

	let {
		items
	}: {
		items: {
			title: string;
			url: ResolvedPathname;
			icon?: LucideIcon;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
	} = $props();
	const sidebar = useSidebar();
	const isMobile = new IsMobile();

	async function handleClick(url: ResolvedPathname, e?: MouseEvent) {
		if (e && (e.target as HTMLElement).closest('svg')) {
			return;
		}
		if (isMobile.current) {
			sidebar.toggle();
		}

		await goto(url);
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>{m.nav_navigation()}</Sidebar.GroupLabel>
	<Sidebar.Menu class="gap-1">
		{#each items as item (item.title)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					tooltipContent={item.title}
					isActive={item.isActive}
					onclick={() => handleClick(item.url)}
					class="h-11 rounded-xl text-[15px] font-medium data-[active=true]:bg-primary/15 data-[active=true]:font-semibold data-[active=true]:text-foreground [&_svg]:data-[active=true]:text-primary"
				>
					{#if item.icon}
						<item.icon class="size-5!" />
					{/if}
					<span>{item.title}</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
