<script lang="ts">
	import AuthShell from '$lib/components/auth-shell.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Mail, ArrowLeft, CheckCircle, AlertCircle } from '@lucide/svelte';
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
		} catch (e: unknown) {
			error = (e instanceof Error && e.message) || m.passwordReset_error_failed();
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.passwordReset_forgotPassword()} - {m.common_appName()}</title>
</svelte:head>

<AuthShell title={m.passwordReset_forgotPassword()} subtitle={m.passwordReset_enterEmailToReset()}>
	{#if success}
		<div class="flex flex-col items-center gap-4 rounded-2xl bg-success/15 p-6 text-center">
			<CheckCircle class="h-12 w-12 text-success" />
			<div class="space-y-2">
				<p class="font-medium text-success">{m.passwordReset_checkEmail()}</p>
				<p class="text-sm text-muted-foreground">
					{m.passwordReset_resetLinkSent({ email })}
				</p>
			</div>
			<Button onclick={() => goto(resolve('/login'))} variant="outline" class="mt-2">
				<ArrowLeft class="mr-2 h-4 w-4" />
				{m.passwordReset_backToLogin()}
			</Button>
		</div>
	{:else}
		<form onsubmit={requestReset} class="space-y-6">
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
						disabled={loading}
						class="h-12 pl-11"
					/>
				</div>
			</div>

			{#if error}
				<div class="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4">
					<AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
					<p class="text-sm text-destructive">{error}</p>
				</div>
			{/if}

			<Button type="submit" disabled={loading} size="lg" class="w-full">
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
				href={resolve('/login')}
				class="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4" />
				{m.passwordReset_backToLogin()}
			</a>
		</div>
	{/if}
</AuthShell>
