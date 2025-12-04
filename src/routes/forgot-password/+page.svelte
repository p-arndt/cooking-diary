<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Mail, ArrowLeft, CheckCircle, AlertCircle } from '@lucide/svelte';
	import sentiologo from '$lib/assets/logo.png';
	import * as m from '$lib/paraglide/messages.js';

	let email = $state('');
	let error = $state('');
	let loading = $state(false);
	let success = $state(false);

	async function requestReset(e: Event) {
		e.preventDefault();
		error = '';
		success = false;

		if (!email.trim()) {
			error = m.auth_error_emailRequired();
			return;
		}

		loading = true;
		try {
			const response = await authClient.requestPasswordReset({
				email,
				redirectTo: '/reset-password'
			});

			if (response.error) {
				error = response.error.message || m.passwordReset_error_failed();
			} else {
				success = true;
			}
		} catch (e: any) {
			error = e.message || m.passwordReset_error_failed();
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.passwordReset_forgotPassword()} - {m.common_appName()}</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center from-background via-background to-primary/5 p-4"
>
	<Card class="w-full max-w-md border-border bg-card/80 shadow-2xl backdrop-blur-sm">
		<CardHeader class="pb-2 text-center">
			<div class="mx-auto mb-4 flex items-center justify-center">
				<img src={sentiologo} alt="{m.common_appName()} logo" class="h-32 w-auto" />
			</div>
			<CardTitle class="text-2xl font-bold text-primary">{m.passwordReset_forgotPassword()}</CardTitle>
			<CardDescription class="mt-2">
				{m.passwordReset_enterEmailToReset()}
			</CardDescription>
		</CardHeader>
		<CardContent class="pt-6">
			{#if success}
				<div
					class="flex flex-col items-center gap-4 rounded-lg border border-green-500/20 bg-green-500/10 p-6 text-center"
				>
					<CheckCircle class="h-12 w-12 text-green-500" />
					<div class="space-y-2">
						<p class="font-medium text-green-600">{m.passwordReset_checkEmail()}</p>
						<p class="text-sm text-muted-foreground">
							{m.passwordReset_resetLinkSent({ email })}
						</p>
					</div>
					<Button onclick={() => goto('/login')} variant="outline" class="mt-2">
						<ArrowLeft class="mr-2 h-4 w-4" />
						{m.passwordReset_backToLogin()}
					</Button>
				</div>
			{:else}
				<form onsubmit={requestReset} class="space-y-6">
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
								disabled={loading}
								class="h-12 border-border bg-background pl-10 transition-colors focus:border-ring focus:ring-ring"
							/>
						</div>
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
						disabled={loading}
						class="h-12 w-full transform rounded-lg bg-primary font-medium text-primary-foreground transition-all duration-200 hover:scale-105 hover:bg-primary/90 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if loading}
							<div class="flex items-center gap-2">
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
								></div>
								{m.passwordReset_sending()}
							</div>
						{:else}
							{m.passwordReset_sendResetLink()}
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

