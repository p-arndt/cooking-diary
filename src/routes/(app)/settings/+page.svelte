<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Sparkles, Calendar, Clock, X, Check, Lock, Settings as SettingsIcon, Globe, Palette } from '@lucide/svelte';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import PasswordChangeForm from '$lib/components/password-change-form.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { setLocale, getLocale } from '$lib/paraglide/runtime.js';
	import { toggleMode } from 'mode-watcher';
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

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8">
	<div>
		<h1 class="text-4xl font-bold tracking-tight">{m.settings_title()}</h1>
		<p class="mt-1 text-muted-foreground">{m.settings_subtitle()}</p>
	</div>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List class="w-full justify-start">
			<Tabs.Trigger value="general">
				<SettingsIcon class="h-4 w-4" />
				{m.settings_general()}
			</Tabs.Trigger>
			<Tabs.Trigger value="suggestions">
				<Sparkles class="h-4 w-4" />
				{m.settings_mealSuggestions()}
			</Tabs.Trigger>
			<Tabs.Trigger value="account">
				<Lock class="h-4 w-4" />
				{m.settings_account()}
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="general" class="mt-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Globe class="h-5 w-5 text-blue-500" />
						{m.settings_language()}
					</CardTitle>
					<CardDescription>
						{m.settings_languageDescription()}
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="space-y-3">
						<Label>{m.settings_selectLanguage()}</Label>
						<Select.Root
							type="single"
							bind:value={currentLanguage}
							onValueChange={(value: string) => {
								setLocale(value as 'en' | 'de');
							}}
						>
							<Select.Trigger class="w-full">
								{currentLanguage === 'en' ? m.settings_languageEnglish() : m.settings_languageGerman()}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="en" label={m.settings_languageEnglish()}>
									{m.settings_languageEnglish()}
								</Select.Item>
								<Select.Item value="de" label={m.settings_languageGerman()}>
									{m.settings_languageGerman()}
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</CardContent>
			</Card>

			<Card class="mt-6">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Palette class="h-5 w-5 text-purple-500" />
						{m.settings_appearance()}
					</CardTitle>
					<CardDescription>
						{m.settings_appearanceDescription()}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div class="space-y-0.5">
							<Label class="flex items-center gap-2">
								<Palette class="h-4 w-4" />
								{m.settings_theme()}
							</Label>
							<p class="text-sm text-muted-foreground">
								{m.settings_themeDescription()}
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onclick={toggleMode}
							class="h-10 w-10"
						>
							<SunIcon
								class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"
							/>
							<MoonIcon
								class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
							/>
							<span class="sr-only">{m.settings_toggleTheme()}</span>
						</Button>
					</div>
				</CardContent>
			</Card>
		</Tabs.Content>

		<Tabs.Content value="suggestions" class="mt-6">
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
			>
				<input type="hidden" name="daysThreshold" value={daysThreshold} />
				<input type="hidden" name="useDayOfWeek" value={useDayOfWeek.toString()} />
				<input type="hidden" name="excludedCategoryIds" value={JSON.stringify(excludedCategoryIds)} />

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Sparkles class="h-5 w-5 text-amber-500" />
							{m.settings_mealSuggestions()}
						</CardTitle>
						<CardDescription>
							{m.settings_mealSuggestionsDesc()}
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<div class="space-y-0.5">
									<Label class="flex items-center gap-2">
										<Clock class="h-4 w-4" />
										{m.settings_recentlyCooked()}
									</Label>
									<p class="text-sm text-muted-foreground">
										{daysLabel}
									</p>
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
								<Select.Content>
									<Select.Item value="0" label={m.settings_showAllNoFilter()}>
										{m.settings_showAllNoFilter()}
									</Select.Item>
									<Select.Item value="3" label={m.settings_days({ days: 3 })}>
										{m.settings_days({ days: 3 })}
									</Select.Item>
									<Select.Item value="7" label={m.settings_days({ days: 7 })}>
										{m.settings_days({ days: 7 })}
									</Select.Item>
									<Select.Item value="14" label={m.settings_daysDefault({ days: 14 })}>
										{m.settings_daysDefault({ days: 14 })}
									</Select.Item>
									<Select.Item value="21" label={m.settings_days({ days: 21 })}>
										{m.settings_days({ days: 21 })}
									</Select.Item>
									<Select.Item value="30" label={m.settings_days({ days: 30 })}>
										{m.settings_days({ days: 30 })}
									</Select.Item>
									<Select.Item value="60" label={m.settings_days({ days: 60 })}>
										{m.settings_days({ days: 60 })}
									</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>

						<div class="flex items-center justify-between rounded-lg border p-4">
							<div class="space-y-0.5">
								<Label class="flex items-center gap-2">
									<Calendar class="h-4 w-4" />
									{m.settings_dayOfWeek()}
								</Label>
								<p class="text-sm text-muted-foreground">
									{m.settings_dayOfWeekDesc({ day: TODAY_NAME })}
								</p>
							</div>
							<Switch checked={useDayOfWeek} onCheckedChange={(v) => (useDayOfWeek = v)} />
						</div>

						<div class="space-y-3">
							<div>
								<Label>{m.settings_excludedCategories()}</Label>
								<p class="text-sm text-muted-foreground">
									{m.settings_excludedCategoriesDesc()}
								</p>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each data.categories as category}
									{@const isExcluded = excludedCategoryIds.includes(category.id)}
									<button
										type="button"
										onclick={() => toggleCategory(category.id)}
										class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors {isExcluded
											? 'border-destructive/50 bg-destructive/10 text-destructive'
											: 'border-border hover:bg-accent'}"
									>
										{#if isExcluded}
											<X class="h-3 w-3" />
										{/if}
										{category.name}
									</button>
								{/each}
								{#if data.categories.length === 0}
									<p class="text-sm text-muted-foreground">{m.settings_noCategoriesYet()}</p>
								{/if}
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
								<span class="flex items-center gap-1 text-sm text-green-600">
									<Check class="h-4 w-4" />
									{m.settings_settingsSaved()}
								</span>
							{/if}
						</div>
					</CardContent>
				</Card>
			</form>
		</Tabs.Content>


		<Tabs.Content value="account" class="mt-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Lock class="h-5 w-5 text-blue-500" />
						{m.passwordChange_title()}
					</CardTitle>
					<CardDescription>
						{m.passwordChange_description()}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<PasswordChangeForm />
				</CardContent>
			</Card>
		</Tabs.Content>
	</Tabs.Root>
</div>
