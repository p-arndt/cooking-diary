<script lang="ts">
	import AuthShell from '$lib/components/auth-shell.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';

	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let error = $state('');
	let loading = $state(false);
	let success = $state(false);

	let token = $derived(page.url.searchParams.get('token') || '');

	let passwordsMatch = $derived(password && confirmPassword && password === confirmPassword);

	async function resetPassword(e: Event) {
		e.preventDefault();
		error = '';
		success = false;

		if (!token) {
			error = m.passwordReset_error_invalidToken();
			return;
		}

		if (!password) {
			error = m.auth_error_passwordRequired();
			return;
		}

		if (password.length < 8) {
			error = m.passwordReset_error_minLength();
			return;
		}

		if (!passwordsMatch) {
			error = m.auth_passwordsDoNotMatch();
			return;
		}

		loading = true;
		try {
			const response = await authClient.resetPassword({
				newPassword: password,
				token
			});

			if (response.error) {
				error = response.error.message || m.passwordReset_error_failed();
			} else {
				success = true;
				setTimeout(() => {
					goto(resolve('/login'));
				}, 2000);
			}
		} catch (e: unknown) {
			error = (e instanceof Error && e.message) || m.passwordReset_error_failed();
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.passwordReset_resetPassword()} - {m.common_appName()}</title>
</svelte:head>

<AuthShell title={m.passwordReset_resetPassword()} subtitle={m.passwordReset_enterNewPassword()}>
	{#if success}
		<div class="flex flex-col items-center gap-4 rounded-2xl bg-success/15 p-6 text-center">
			<CheckCircle class="h-12 w-12 text-success" />
			<div class="space-y-2">
				<p class="font-medium text-success">{m.passwordReset_passwordResetSuccess()}</p>
				<p class="text-sm text-muted-foreground">
					{m.passwordReset_redirectingToLogin()}
				</p>
			</div>
		</div>
	{:else if !token}
		<div class="flex flex-col items-center gap-4 rounded-2xl bg-destructive/10 p-6 text-center">
			<AlertCircle class="h-12 w-12 text-destructive" />
			<div class="space-y-2">
				<p class="font-medium text-destructive">{m.passwordReset_error_invalidToken()}</p>
				<p class="text-sm text-muted-foreground">
					{m.passwordReset_error_tokenMissing()}
				</p>
			</div>
			<Button onclick={() => goto(resolve('/forgot-password'))} variant="outline" class="mt-2">
				{m.passwordReset_requestNewLink()}
			</Button>
		</div>
	{:else}
		<form onsubmit={resetPassword} class="space-y-6">
			<div class="space-y-2">
				<Label for="password" class="text-sm font-medium text-foreground">
					{m.auth_password()}
				</Label>
				<div class="relative">
					<Lock class="absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="password"
						type={showPassword ? 'text' : 'password'}
						placeholder={m.passwordReset_newPasswordPlaceholder()}
						bind:value={password}
						required
						disabled={loading}
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
				<p class="text-xs text-muted-foreground">{m.passwordReset_minLengthHint()}</p>
			</div>

			<div class="space-y-2">
				<Label for="confirmPassword" class="text-sm font-medium text-foreground">
					{m.auth_confirmPassword()}
				</Label>
				<div class="relative">
					<Lock class="absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="confirmPassword"
						type={showConfirmPassword ? 'text' : 'password'}
						placeholder={m.auth_confirmPasswordPlaceholder()}
						bind:value={confirmPassword}
						required
						disabled={loading}
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
				{#if confirmPassword}
					<p class="text-xs {passwordsMatch ? 'text-success' : 'text-destructive'}">
						{#if passwordsMatch}
							{m.auth_passwordsMatch()}
						{:else}
							{m.auth_passwordsDoNotMatch()}
						{/if}
					</p>
				{/if}
			</div>

			{#if error}
				<div class="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4">
					<AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
					<p class="text-sm text-destructive">{error}</p>
				</div>
			{/if}

			<Button
				type="submit"
				disabled={loading || !passwordsMatch || !password}
				size="lg"
				class="w-full"
			>
				{#if loading}
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
						></div>
						{m.passwordReset_resetting()}
					</div>
				{:else}
					{m.passwordReset_resetPassword()}
				{/if}
			</Button>
		</form>

		<div class="mt-4 text-center">
			<a
				href={resolve('/login')}
				class="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4" />
				{m.passwordReset_backToLogin()}
			</a>
		</div>
	{/if}
</AuthShell>
