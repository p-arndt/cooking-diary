<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import PageHeader from '$lib/components/page-header.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import {
		Calendar,
		Check,
		Clock,
		Globe,
		Lock,
		LogOut,
		Monitor,
		Moon,
		Palette,
		Settings as SettingsIcon,
		Sparkles,
		Sun,
		X
	} from '@lucide/svelte';
	import PasswordChangeForm from '$lib/components/password-change-form.svelte';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import { getUserInitials } from '$lib/utils/user';
	import { setLocale, getLocale } from '$lib/paraglide/runtime.js';
	import { setMode, userPrefersMode } from 'mode-watcher';
	import * as m from '$lib/paraglide/messages.js';

	let { data }: { data: PageData } = $props();

	let daysThreshold = $state(data.settings.suggestionDaysThreshold);
	let useDayOfWeek = $state(data.settings.suggestionUseDayOfWeek);
	let excludedCategoryIds = $state<string[]>(data.settings.suggestionExcludedCategoryIds || []);
	let isSubmitting = $state(false);
	let showSuccess = $state(false);
	let activeTab = $state('general');
	let currentLanguage = $state<string>(getLocale());
	let selectedDaysThreshold = $derived<string>(daysThreshold.toString());

	const DAY_NAMES = [
		m.common_days_sunday(),
		m.common_days_monday(),
		m.common_days_tuesday(),
		m.common_days_wednesday(),
		m.common_days_thursday(),
		m.common_days_friday(),
		m.common_days_saturday()
	];
	const TODAY_NAME = DAY_NAMES[new Date().getDay()];

	function toggleCategory(categoryId: string) {
		if (excludedCategoryIds.includes(categoryId)) {
			excludedCategoryIds = excludedCategoryIds.filter((id) => id !== categoryId);
		} else {
			excludedCategoryIds = [...excludedCategoryIds, categoryId];
		}
	}

	const tabs = $derived([
		{ value: 'general', label: m.settings_general(), icon: SettingsIcon },
		{ value: 'suggestions', label: m.settings_mealSuggestions(), icon: Sparkles },
		{ value: 'account', label: m.settings_account(), icon: Lock }
	]);

	const themeOptions = $derived([
		{ value: 'light' as const, label: m.settings_themeLight(), icon: Sun },
		{ value: 'dark' as const, label: m.settings_themeDark(), icon: Moon },
		{ value: 'system' as const, label: m.settings_themeSystem(), icon: Monitor }
	]);

	const languageOptions = $derived([
		{ value: 'de' as const, label: m.settings_languageGerman() },
		{ value: 'en' as const, label: m.settings_languageEnglish() }
	]);

	async function logout() {
		try {
			await authClient.signOut();
			await goto('/login');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}

	const daysLabel = $derived(
		daysThreshold === 0
			? m.settings_alwaysShowAll()
			: daysThreshold === 1
				? m.settings_excludeYesterday()
				: m.settings_excludeLastDays({ days: daysThreshold })
	);
</script>

<svelte:head>
	<title>{m.settings_pageTitle()}</title>
</svelte:head>

{#snippet sectionHeader(icon: typeof Globe, tint: string, title: string, description: string)}
	{@const Icon = icon}
	<div class="mb-4 flex items-start gap-3">
		<span class={['flex size-9 shrink-0 items-center justify-center rounded-2xl', tint]}>
			<Icon class="size-4.5" />
		</span>
		<div class="min-w-0">
			<h2 class="font-bold">{title}</h2>
			<p class="text-sm text-muted-foreground">{description}</p>
		</div>
	</div>
{/snippet}

<div class="mx-auto max-w-3xl space-y-6 px-4 pt-6 md:px-8 md:pt-2">
	<PageHeader title={m.settings_title()} subtitle={m.settings_subtitle()} />

	<section
		class="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-primary to-accent-variant p-4 text-primary-foreground shadow-lifted"
	>
		<Avatar.Root class="size-14 rounded-2xl ring-4 ring-primary-foreground/10">
			<Avatar.Image src={data.user.image ?? undefined} alt={data.user.name} />
			<Avatar.Fallback class="rounded-2xl bg-primary-foreground/15 text-lg font-extrabold">
				{getUserInitials(data.user.name)}
			</Avatar.Fallback>
		</Avatar.Root>
		<div class="min-w-0 flex-1">
			<p class="truncate text-lg leading-tight font-extrabold">{data.user.name}</p>
			<p class="truncate text-sm opacity-75">{data.user.email}</p>
		</div>
		<Button
			variant="ghost"
			onclick={logout}
			class="shrink-0 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
		>
			<LogOut />
			<span class="hidden sm:inline">{m.nav_logout()}</span>
			<span class="sr-only sm:hidden">{m.nav_logout()}</span>
		</Button>
	</section>

	<div class="flex rounded-full bg-secondary p-1" role="tablist">
		{#each tabs as tab (tab.value)}
			<button
				role="tab"
				aria-selected={activeTab === tab.value}
				onclick={() => (activeTab = tab.value)}
				class={[
					'flex min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-all',
					activeTab === tab.value ? 'flex-[2] sm:flex-1' : 'flex-1',
					activeTab === tab.value
						? 'bg-card text-foreground shadow-soft'
						: 'text-muted-foreground hover:text-foreground'
				]}
			>
				<tab.icon class="size-4 shrink-0" />
				<span class={['truncate', activeTab !== tab.value && 'sr-only sm:not-sr-only']}
					>{tab.label}</span
				>
			</button>
		{/each}
	</div>

	{#if activeTab === 'general'}
		<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
			{@render sectionHeader(
				Globe,
				'bg-chart-4/15 text-chart-4',
				m.settings_language(),
				m.settings_languageDescription()
			)}
			<div
				class="grid grid-cols-2 gap-2"
				role="radiogroup"
				aria-label={m.settings_selectLanguage()}
			>
				{#each languageOptions as option (option.value)}
					<button
						type="button"
						role="radio"
						aria-checked={currentLanguage === option.value}
						onclick={() => {
							currentLanguage = option.value;
							setLocale(option.value);
						}}
						class={[
							'flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-colors',
							currentLanguage === option.value
								? 'border-primary bg-primary/10'
								: 'border-transparent bg-secondary hover:bg-secondary/70'
						]}
					>
						{option.label}
						{#if currentLanguage === option.value}
							<Check class="size-4 text-primary" strokeWidth={3} />
						{/if}
					</button>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
			{@render sectionHeader(
				Palette,
				'bg-chart-5/15 text-chart-5',
				m.settings_appearance(),
				m.settings_themeDescription()
			)}
			<div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label={m.settings_theme()}>
				{#each themeOptions as option (option.value)}
					{@const active = userPrefersMode.current === option.value}
					<button
						type="button"
						role="radio"
						aria-checked={active}
						onclick={() => setMode(option.value)}
						class={[
							'flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-sm font-semibold transition-colors',
							active
								? 'border-primary bg-primary/10'
								: 'border-transparent bg-secondary hover:bg-secondary/70'
						]}
					>
						<option.icon class={['size-5', active && 'text-primary']} />
						{option.label}
					</button>
				{/each}
			</div>
		</section>
	{:else if activeTab === 'suggestions'}
		<form
			method="POST"
			action="?/updateSuggestionSettings"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result }) => {
					isSubmitting = false;
					if (result.type === 'success') {
						showSuccess = true;
						setTimeout(() => {
							showSuccess = false;
						}, 3000);
					}
				};
			}}
			class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
		>
			<input type="hidden" name="daysThreshold" value={daysThreshold} />
			<input type="hidden" name="useDayOfWeek" value={useDayOfWeek.toString()} />
			<input type="hidden" name="excludedCategoryIds" value={JSON.stringify(excludedCategoryIds)} />

			{@render sectionHeader(
				Sparkles,
				'bg-primary/15 text-primary',
				m.settings_mealSuggestions(),
				m.settings_mealSuggestionsDesc()
			)}

			<div class="divide-y divide-border/60">
				<div class="space-y-3 py-4">
					<div class="flex items-start gap-3">
						<Clock class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
						<div>
							<Label>{m.settings_recentlyCooked()}</Label>
							<p class="text-sm text-muted-foreground">{daysLabel}</p>
						</div>
					</div>
					<Select.Root
						type="single"
						bind:value={selectedDaysThreshold}
						onValueChange={(value) => {
							daysThreshold = parseInt(value);
						}}
					>
						<Select.Trigger class="w-full">
							{daysLabel}
						</Select.Trigger>
						<Select.Content class="rounded-2xl">
							<Select.Item value="0" label={m.settings_showAllNoFilter()}>
								{m.settings_showAllNoFilter()}
							</Select.Item>
							{#each [3, 7] as days (days)}
								<Select.Item value={days.toString()} label={m.settings_days({ days })}>
									{m.settings_days({ days })}
								</Select.Item>
							{/each}
							<Select.Item value="14" label={m.settings_daysDefault({ days: 14 })}>
								{m.settings_daysDefault({ days: 14 })}
							</Select.Item>
							{#each [21, 30, 60] as days (days)}
								<Select.Item value={days.toString()} label={m.settings_days({ days })}>
									{m.settings_days({ days })}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<label class="flex cursor-pointer items-center justify-between gap-4 py-4">
					<div class="flex items-start gap-3">
						<Calendar class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
						<div>
							<span class="text-sm font-medium">{m.settings_dayOfWeek()}</span>
							<p class="text-sm text-muted-foreground">
								{m.settings_dayOfWeekDesc({ day: TODAY_NAME })}
							</p>
						</div>
					</div>
					<Switch checked={useDayOfWeek} onCheckedChange={(v) => (useDayOfWeek = v)} />
				</label>

				<div class="space-y-3 py-4">
					<div>
						<Label>{m.settings_excludedCategories()}</Label>
						<p class="text-sm text-muted-foreground">{m.settings_excludedCategoriesDesc()}</p>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each data.categories as category (category.id)}
							{@const isExcluded = excludedCategoryIds.includes(category.id)}
							<button
								type="button"
								onclick={() => toggleCategory(category.id)}
								aria-pressed={isExcluded}
								class={[
									'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
									isExcluded
										? 'bg-destructive/15 text-destructive line-through decoration-2'
										: 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
								]}
							>
								{#if isExcluded}
									<X class="size-3.5" />
								{/if}
								{category.name}
							</button>
						{/each}
						{#if data.categories.length === 0}
							<p class="text-sm text-muted-foreground">{m.settings_noCategoriesYet()}</p>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex items-center gap-3 pt-2">
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						{m.common_saving()}
					{:else}
						{m.settings_saveSettings()}
					{/if}
				</Button>
				{#if showSuccess}
					<span class="flex items-center gap-1 text-sm font-semibold text-success">
						<Check class="size-4" />
						{m.settings_settingsSaved()}
					</span>
				{/if}
			</div>
		</form>
	{:else}
		<section class="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
			{@render sectionHeader(
				Lock,
				'bg-chart-2/15 text-chart-2',
				m.passwordChange_title(),
				m.passwordChange_description()
			)}
			<PasswordChangeForm />
		</section>

		<Button
			variant="outline"
			onclick={logout}
			class="w-full text-destructive hover:text-destructive"
		>
			<LogOut />
			{m.nav_logout()}
		</Button>
	{/if}
</div>
