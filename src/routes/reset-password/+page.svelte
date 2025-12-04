<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from '@lucide/svelte';
	import sentiologo from '$lib/assets/logo.png';
	import * as m from '$lib/paraglide/messages.js';

	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let error = $state('');
	let loading = $state(false);
	let success = $state(false);

	let token = $derived.by(() => {
		const url = new URL($page.url);
		return url.searchParams.get('token') || '';
	});

	let passwordsMatch = $derived(
		password && confirmPassword && password === confirmPassword
	);

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
					goto('/login');
				}, 2000);
			}
		} catch (e: any) {
			error = e.message || m.passwordReset_error_failed();
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.passwordReset_resetPassword()} - {m.common_appName()}</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center from-background via-background to-primary/5 p-4"
>
	<Card class="w-full max-w-md border-border bg-card/80 shadow-2xl backdrop-blur-sm">
		<CardHeader class="pb-2 text-center">
			<div class="mx-auto mb-4 flex items-center justify-center">
				<img src={sentiologo} alt="{m.common_appName()} logo" class="h-32 w-auto" />
			</div>
			<CardTitle class="text-2xl font-bold text-primary">{m.passwordReset_resetPassword()}</CardTitle>
			<CardDescription class="mt-2">
				{m.passwordReset_enterNewPassword()}
			</CardDescription>
		</CardHeader>
		<CardContent class="pt-6">
			{#if success}
				<div
					class="flex flex-col items-center gap-4 rounded-lg border border-green-500/20 bg-green-500/10 p-6 text-center"
				>
					<CheckCircle class="h-12 w-12 text-green-500" />
					<div class="space-y-2">
						<p class="font-medium text-green-600">{m.passwordReset_passwordResetSuccess()}</p>
						<p class="text-sm text-muted-foreground">
							{m.passwordReset_redirectingToLogin()}
						</p>
					</div>
				</div>
			{:else if !token}
				<div
					class="flex flex-col items-center gap-4 rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center"
				>
					<AlertCircle class="h-12 w-12 text-destructive" />
					<div class="space-y-2">
						<p class="font-medium text-destructive">{m.passwordReset_error_invalidToken()}</p>
						<p class="text-sm text-muted-foreground">
							{m.passwordReset_error_tokenMissing()}
						</p>
					</div>
					<Button onclick={() => goto('/forgot-password')} variant="outline" class="mt-2">
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
							<Lock
								class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
							/>
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								placeholder={m.passwordReset_newPasswordPlaceholder()}
								bind:value={password}
								required
								disabled={loading}
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
						<p class="text-xs text-muted-foreground">{m.passwordReset_minLengthHint()}</p>
					</div>

					<div class="space-y-2">
						<Label for="confirmPassword" class="text-sm font-medium text-foreground">
							{m.auth_confirmPassword()}
						</Label>
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
								disabled={loading}
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
						{#if confirmPassword}
							<p
								class="text-xs {passwordsMatch
									? 'text-green-600'
									: 'text-destructive'}"
							>
								{#if passwordsMatch}
									{m.auth_passwordsMatch()}
								{:else}
									{m.auth_passwordsDoNotMatch()}
								{/if}
							</p>
						{/if}
					</div>

					{#if error}
						<div
							class="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4"
						>
							<AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
							<p class="text-sm text-destructive">{error}</p>
						</div>
					{/if}

					<Button
						type="submit"
						disabled={loading || !passwordsMatch || !password}
						class="h-12 w-full transform rounded-lg bg-primary font-medium text-primary-foreground transition-all duration-200 hover:scale-105 hover:bg-primary/90 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
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
						href="/login"
						class="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft class="h-4 w-4" />
						{m.passwordReset_backToLogin()}
					</a>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

