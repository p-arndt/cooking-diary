<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	let passwordsMatch = $derived(
		newPassword && confirmPassword && newPassword === confirmPassword
	);

	async function changePassword(e: Event) {
		e.preventDefault();
		error = '';
		success = false;

		if (!currentPassword) {
			error = m.passwordChange_error_currentRequired();
			return;
		}

		if (!newPassword) {
			error = m.auth_error_passwordRequired();
			return;
		}

		if (newPassword.length < 8) {
			error = m.passwordReset_error_minLength();
			return;
		}

		if (!passwordsMatch) {
			error = m.auth_passwordsDoNotMatch();
			return;
		}

		if (currentPassword === newPassword) {
			error = m.passwordChange_error_samePassword();
			return;
		}

		loading = true;
		try {
			const response = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true
			});

			if (response.error) {
				error = response.error.message || m.passwordChange_error_failed();
			} else {
				success = true;
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
				setTimeout(() => {
					success = false;
				}, 3000);
			}
		} catch (e: any) {
			error = e.message || m.passwordChange_error_failed();
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit={changePassword} class="space-y-6">
	<div class="space-y-2">
		<Label for="currentPassword" class="text-sm font-medium text-foreground">
			{m.passwordChange_currentPassword()}
		</Label>
		<div class="relative">
			<Lock
				class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
			/>
			<Input
				id="currentPassword"
				type={showCurrentPassword ? 'text' : 'password'}
				placeholder={m.passwordChange_currentPasswordPlaceholder()}
				bind:value={currentPassword}
				required
				disabled={loading}
				class="h-12 border-border bg-background pr-10 pl-10 transition-colors focus:border-ring focus:ring-ring"
			/>
			<button
				type="button"
				onclick={() => (showCurrentPassword = !showCurrentPassword)}
				class="absolute top-1/2 right-3 -translate-y-1/2 transform text-muted-foreground transition-colors hover:text-foreground"
			>
				{#if showCurrentPassword}
					<EyeOff class="h-5 w-5" />
				{:else}
					<Eye class="h-5 w-5" />
				{/if}
			</button>
		</div>
	</div>

	<div class="space-y-2">
		<Label for="newPassword" class="text-sm font-medium text-foreground">
			{m.passwordChange_newPassword()}
		</Label>
		<div class="relative">
			<Lock
				class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
			/>
			<Input
				id="newPassword"
				type={showNewPassword ? 'text' : 'password'}
				placeholder={m.passwordChange_newPasswordPlaceholder()}
				bind:value={newPassword}
				required
				disabled={loading}
				class="h-12 border-border bg-background pr-10 pl-10 transition-colors focus:border-ring focus:ring-ring"
			/>
			<button
				type="button"
				onclick={() => (showNewPassword = !showNewPassword)}
				class="absolute top-1/2 right-3 -translate-y-1/2 transform text-muted-foreground transition-colors hover:text-foreground"
			>
				{#if showNewPassword}
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

	{#if success}
		<div
			class="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4"
		>
			<CheckCircle class="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
			<p class="text-sm text-green-600">{m.passwordChange_success()}</p>
		</div>
	{/if}

	<div class="flex items-center gap-3 pt-2">
		<Button type="submit" disabled={loading || !passwordsMatch || !newPassword || !currentPassword}>
			{#if loading}
				{m.passwordChange_changing()}
			{:else}
				{m.passwordChange_changePassword()}
			{/if}
		</Button>
	</div>
</form>

