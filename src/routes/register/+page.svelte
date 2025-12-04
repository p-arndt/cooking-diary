<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Check, Eye, EyeOff, Lock, Mail, Shield, User, X } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let error = $state('');
	let loading = $state(false);

	async function register(e: Event) {
		e.preventDefault();
		error = '';

		if (!name.trim()) {
			error = m.auth_error_nameRequired();
			return;
		}

		if (!email.trim()) {
			error = m.auth_error_emailRequired();
			return;
		}

		if (password !== confirmPassword) {
			error = m.auth_passwordsDoNotMatch();
			return;
		}

		loading = true;
		try {
			await authClient.signUp.email({ email, password, name: name.trim() });

			goto('/');
		} catch (e: any) {
			error = e.message || m.auth_error_registrationFailed();
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.auth_createAccount()} - {m.common_appName()}</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center from-background via-background to-primary/5 p-4"
>
	<Card class="w-full max-w-md border-border bg-card/80 shadow-2xl backdrop-blur-sm">
		<CardHeader class="pb-2 text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
				<User class="h-8 w-8 text-primary-foreground" />
			</div>
			<CardTitle class="text-2xl font-bold text-primary">{m.auth_createAccount()}</CardTitle>
			<p class="mt-2 text-muted-foreground">{m.auth_joinUs()}</p>
		</CardHeader>
		<CardContent class="pt-6">
			<form onsubmit={register} class="space-y-6">
				<div class="space-y-2">
					<Label for="name" class="text-sm font-medium text-foreground">{m.auth_name()}</Label>
					<div class="relative">
						<User
							class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
						/>
						<Input
							id="name"
							type="text"
							placeholder={m.auth_namePlaceholder()}
							bind:value={name}
							required
							class="h-12 border-border bg-background pl-10 transition-colors focus:border-ring focus:ring-ring"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="email" class="text-sm font-medium text-foreground">{m.auth_email()}</Label>
					<div class="relative">
						<Mail
							class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
						/>
						<Input
							id="email"
							type="email"
							placeholder={m.auth_emailPlaceholder()}
							bind:value={email}
							required
							class="h-12 border-border bg-background pl-10 transition-colors focus:border-ring focus:ring-ring"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="password" class="text-sm font-medium text-foreground">{m.auth_password()}</Label>
					<div class="relative">
						<Lock
							class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
						/>
						<Input
							id="password"
							type={showPassword ? 'text' : 'password'}
							placeholder={m.auth_createStrongPassword()}
							bind:value={password}
							required
							minlength={8}
							class="h-12 border-border bg-background pr-10 pl-10 transition-colors focus:border-ring focus:ring-ring"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute top-1/2 right-3 -translate-y-1/2 transform text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if showPassword}
								<EyeOff class="h-5 w-5" />
							{:else}
								<Eye class="h-5 w-5" />
							{/if}
						</button>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="confirmPassword" class="text-sm font-medium text-foreground"
						>{m.auth_confirmPassword()}</Label
					>
					<div class="relative">
						<Lock
							class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
						/>
						<Input
							id="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							placeholder={m.auth_confirmPasswordPlaceholder()}
							bind:value={confirmPassword}
							required
							class="h-12 border-border bg-background pr-10 pl-10 transition-colors focus:border-ring focus:ring-ring"
						/>
						<button
							type="button"
							onclick={() => (showConfirmPassword = !showConfirmPassword)}
							class="absolute top-1/2 right-3 -translate-y-1/2 transform text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if showConfirmPassword}
								<EyeOff class="h-5 w-5" />
							{:else}
								<Eye class="h-5 w-5" />
							{/if}
						</button>
					</div>
					{#if confirmPassword && password !== confirmPassword}
						<p class="flex items-center gap-1 text-xs text-destructive">
							<X class="h-4 w-4" />
							{m.auth_passwordsDoNotMatch()}
						</p>
					{:else if confirmPassword && password === confirmPassword}
						<p class="flex items-center gap-1 text-xs text-chart-4">
							<Check class="h-4 w-4" />
							{m.auth_passwordsMatch()}
						</p>
					{/if}
				</div>

				{#if error}
					<div
						class="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4"
					>
						<X class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
						<p class="text-sm text-destructive">{error}</p>
					</div>
				{/if}

				<Button
					type="submit"
					disabled={loading}
					class="h-12 w-full transform rounded-lg bg-primary font-medium text-primary-foreground transition-all duration-200 hover:scale-105 hover:bg-primary/90 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						<div class="flex items-center gap-2">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
							></div>
							{m.auth_creatingAccount()}
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<Shield class="h-5 w-5" />
							{m.auth_createAccount()}
						</div>
					{/if}
				</Button>
			</form>

			<div class="mt-6 text-center">
				<p class="text-muted-foreground">
					{m.auth_haveAccount()}
					<a href="/login" class="ml-1 font-medium text-primary hover:underline">{m.auth_signInHere()}</a>
				</p>
			</div>
		</CardContent>
	</Card>
</div>
