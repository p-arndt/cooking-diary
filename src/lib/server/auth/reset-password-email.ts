const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

export function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function buildResetPasswordUrl(baseUrl: string, token: string): string {
	const url = new URL('/reset-password', baseUrl);
	url.searchParams.set('token', token);
	return url.toString();
}

export type ResetPasswordEmail = {
	subject: string;
	html: string;
	text: string;
};

export function buildResetPasswordEmail(
	name: string | null | undefined,
	resetUrl: string
): ResetPasswordEmail {
	const greetingName = name || 'there';
	const safeName = escapeHtml(greetingName);
	const safeUrl = escapeHtml(resetUrl);

	return {
		subject: 'Reset your password',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">Reset Your Password</h2>
				<p>Hello ${safeName},</p>
				<p>We received a request to reset your password. Click the button below to reset it:</p>
				<div style="margin: 30px 0;">
					<a href="${safeUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
				</div>
				<p>Or copy and paste this link into your browser:</p>
				<p style="color: #666; word-break: break-all;">${safeUrl}</p>
				<p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
			</div>
		`,
		text: `Reset Your Password\n\nHello ${greetingName},\n\nWe received a request to reset your password. Click the following link to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request a password reset, please ignore this email.`
	};
}
