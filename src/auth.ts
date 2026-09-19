import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { resolvePublicBaseUrl } from '$lib/server/auth/base-url';
import {
	buildResetPasswordEmail,
	buildResetPasswordUrl
} from '$lib/server/auth/reset-password-email';
import { isSignupDisabled } from '$lib/server/auth/signup';
import { parseTrustedProxies } from '$lib/server/auth/trusted-proxies';
import { db } from '$lib/server/db';
import { account, session, user, verification } from '$lib/server/db/schema';
import { sendEmail } from '$lib/server/services/email.service';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';

export const auth = betterAuth({
	advanced: {
		database: {
			generateId: false
		},
		ipAddress: {
			// Rate limiting keys on the client IP. Behind a reverse proxy it has to be read from
			// the forwarded chain, which is only trustworthy once the proxies are known.
			trustedProxies: parseTrustedProxies(env.TRUSTED_PROXIES)
		}
	},
	session: {
		// Sliding expiry: every use (at most once a day) pushes the end out again, so only
		// 90 days without opening the web or native app require signing in again.
		expiresIn: 60 * 60 * 24 * 90,
		updateAge: 60 * 60 * 24
	},
	emailAndPassword: {
		enabled: true,
		disableSignUp: isSignupDisabled(env.DISABLE_SIGNUP),
		sendResetPassword: async ({ user, token }, request) => {
			const baseUrl = resolvePublicBaseUrl({
				betterAuthUrl: env.BETTER_AUTH_URL,
				origin: env.ORIGIN,
				dev,
				requestUrl: request?.url
			});

			if (!baseUrl) {
				console.error(
					'Password reset: no public URL configured. Set BETTER_AUTH_URL (or ORIGIN) to the public URL of this instance; no reset link was sent.'
				);
				return;
			}

			const resetUrl = buildResetPasswordUrl(baseUrl, token);

			try {
				await sendEmail({ to: user.email, ...buildResetPasswordEmail(user.name, resetUrl) });
			} catch (error) {
				console.error('Failed to send password reset email:', error);
				if (dev) {
					console.log('Password reset link (dev fallback):', { to: user.email, url: resetUrl });
				}
			}
		}
	},

	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: user,
			session: session,
			account: account,
			verification: verification
		}
	}),
	// bearer() lets the native app authenticate with `Authorization: Bearer <token>`
	plugins: [bearer(), sveltekitCookies(getRequestEvent)]
});
