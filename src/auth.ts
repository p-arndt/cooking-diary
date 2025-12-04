import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { account, session, user, verification } from '$lib/server/db/schema';
import { sendEmail } from '$lib/server/services/email.service';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';

export const auth = betterAuth({
	advanced: {
		database: {
			generateId: false
		}
	},
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, token }, request) => {
			if (!request) {
				console.error('Password reset: request object is undefined');
				return;
			}

			const baseUrl = new URL(request.url).origin;
			const resetUrl = `${baseUrl}/reset-password?token=${token}`;

			try {
				await sendEmail({
					to: user.email,
					subject: 'Reset your password',
					html: `
						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
							<h2 style="color: #333;">Reset Your Password</h2>
							<p>Hello ${user.name || 'there'},</p>
							<p>We received a request to reset your password. Click the button below to reset it:</p>
							<div style="margin: 30px 0;">
								<a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
							</div>
							<p>Or copy and paste this link into your browser:</p>
							<p style="color: #666; word-break: break-all;">${resetUrl}</p>
							<p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
						</div>
					`,
					text: `Reset Your Password\n\nHello ${user.name || 'there'},\n\nWe received a request to reset your password. Click the following link to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request a password reset, please ignore this email.`
				});
			} catch (error) {
				console.error('Failed to send password reset email:', error);
				console.log('Password reset link (fallback):', {
					to: user.email,
					url: resetUrl,
					token
				});
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
	plugins: [sveltekitCookies(getRequestEvent)]
});
