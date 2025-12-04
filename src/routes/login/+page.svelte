<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from '@lucide/svelte';
	import sentiologo from '$lib/assets/logo.png';
	import * as m from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let loading = $state(false);

	async function login(e: Event) {
		e.preventDefault();
		error = '';

		if (!email.trim()) {
			error = m.auth_error_emailRequired();
			return;
		}

		if (!password) {
			error = m.auth_error_passwordRequired();
			return;
		}

		loading = true;
		try {
			const response = await authClient.signIn.email({ email, password, callbackURL: '/' });
			if (response.error) {
				error = response.error.message || m.auth_error_loginFailed();
			} else {
				await goto('/');
			}
		} catch (e: any) {
			error = e.message || m.auth_error_loginFailed();
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.auth_signIn()} - {m.common_appName()}</title>
</svelte:head>
<div
	class="flex min-h-screen items-center justify-center from-background via-background to-primary/5 p-4"
>
	<Card class="w-full max-w-md border-border bg-card/80 shadow-2xl backdrop-blur-sm">
		<CardHeader class="pb-2 text-center">
			<div class="mx-auto mb-4 flex items-center justify-center">
				<img src={sentiologo} alt="{m.common_appName()} logo" class="h-32 w-auto" />
			</div>
			<CardTitle class="text-2xl font-bold text-primary">{m.auth_welcome()}</CardTitle>
			<p class="mt-2 text-muted-foreground">{m.auth_signInToAccount()}</p>
		</CardHeader>
		<CardContent class="pt-6">
			<form onsubmit={login} class="space-y-6">
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
							placeholder={m.auth_passwordPlaceholder()}
							bind:value={password}
							required
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
							{m.auth_signingIn()}
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<LogIn class="h-5 w-5" />
							{m.auth_signIn()}
						</div>
					{/if}
				</Button>
			</form>

			<div class="mt-4 text-center">
				<p class="text-muted-foreground">
					{m.auth_noAccount()}
					<a href="/register" class="ml-1 font-medium text-primary hover:underline"
						>{m.auth_createOneHere()}</a
					>
				</p>
			</div>

			<div class="mt-4 text-center">
				<a
					href="/forgot-password"
					class="text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					{m.auth_forgotPassword()}
				</a>
			</div>
		</CardContent>
	</Card>
</div>
