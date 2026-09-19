<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { getUserInitials } from '$lib/utils/user';
	import { authClient } from '$lib/auth/client';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { LogOut, Settings } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';

	let {
		user
	}: {
		user: {
			name: string;
			email: string;
			image?: string | null;
		};
	} = $props();

	const sidebar = useSidebar();

	async function onLogout() {
		try {
			await authClient.signOut();
			await goto(resolve('/login'));
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
</script>

<Sidebar.Separator />
<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="flex w-full items-center space-x-2 {sidebar.open &&
					'p-2'} rounded-xl  hover:bg-sidebar-accent!"
			>
				<Avatar.Root class="size-8 rounded-full">
					<Avatar.Image src={user.image ?? undefined} alt={user.name} />
					<Avatar.Fallback class="rounded-full bg-primary/15 font-bold text-primary"
						>{getUserInitials(user.name)}</Avatar.Fallback
					>
				</Avatar.Root>
				<div class="grid flex-1 text-left text-sm leading-tight">
					<span class="truncate font-semibold">{user.name}</span>
					<span class="truncate text-xs text-muted-foreground">{user.email}</span>
				</div>
				<ChevronsUpDownIcon class="ml-auto size-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-2xl p-1.5"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar.Root class="size-8 rounded-full">
							<Avatar.Image src={user.image ?? undefined} alt={user.name} />
							<Avatar.Fallback class="rounded-full bg-primary/15 font-bold text-primary"
								>{getUserInitials(user.name)}</Avatar.Fallback
							>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">{user.name}</span>
							<span class="truncate text-xs text-muted-foreground">{user.email}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item onclick={() => goto(resolve('/settings'))}>
						<Settings />
						{m.nav_settings()}
					</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onclick={onLogout}>
					<LogOut />
					{m.nav_logout()}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
