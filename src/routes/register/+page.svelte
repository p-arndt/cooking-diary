<script lang="ts">
	import AuthShell from '$lib/components/auth-shell.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
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

			goto(resolve('/'));
		} catch (e) {
			error = (e instanceof Error && e.message) || m.auth_error_registrationFailed();
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.auth_createAccount()} - {m.common_appName()}</title>
</svelte:head>

<AuthShell title={m.auth_createAccount()} subtitle={m.auth_joinUs()}>
	{#if data.signupDisabled}
		<div role="status" class="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">
			{m.auth_signupDisabled()}
		</div>
	{:else}
		<form onsubmit={register} class="space-y-6">
			<div class="space-y-2">
				<Label for="name" class="text-sm font-medium text-foreground">{m.auth_name()}</Label>
				<div class="relative">
					<User class="absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="name"
						type="text"
						placeholder={m.auth_namePlaceholder()}
						bind:value={name}
						required
						class="h-12 pl-11"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="email" class="text-sm font-medium text-foreground">{m.auth_email()}</Label>
				<div class="relative">
					<Mail class="absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="email"
						type="email"
						placeholder={m.auth_emailPlaceholder()}
						bind:value={email}
						required
						class="h-12 pl-11"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="password" class="text-sm font-medium text-foreground">{m.auth_password()}</Label
				>
				<div class="relative">
					<Lock class="absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="password"
						type={showPassword ? 'text' : 'password'}
						placeholder={m.auth_createStrongPassword()}
						bind:value={password}
						required
						minlength={8}
						class="h-12 pr-11 pl-11"
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
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
					<Lock class="absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="confirmPassword"
						type={showConfirmPassword ? 'text' : 'password'}
						placeholder={m.auth_confirmPasswordPlaceholder()}
						bind:value={confirmPassword}
						required
						class="h-12 pr-11 pl-11"
					/>
					<button
						type="button"
						onclick={() => (showConfirmPassword = !showConfirmPassword)}
						class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
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
				<div class="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4">
					<X class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
					<p class="text-sm text-destructive">{error}</p>
				</div>
			{/if}

			<Button type="submit" disabled={loading} size="lg" class="w-full">
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
	{/if}

	<div class="mt-6 text-center">
		<p class="text-muted-foreground">
			{m.auth_haveAccount()}
			<a
				href={resolve('/login')}
				class="ml-1 font-bold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:text-primary"
				>{m.auth_signInHere()}</a
			>
		</p>
	</div>
</AuthShell>
