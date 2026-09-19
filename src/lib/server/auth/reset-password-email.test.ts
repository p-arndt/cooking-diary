import { describe, expect, it } from 'vitest';
import { buildResetPasswordEmail, buildResetPasswordUrl, escapeHtml } from './reset-password-email';

describe('escapeHtml', () => {
	it('escapes all HTML-significant characters', () => {
		expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe(
			'&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
		);
	});

	it('leaves plain text untouched', () => {
		expect(escapeHtml('Jane Doe')).toBe('Jane Doe');
	});
});

describe('buildResetPasswordUrl', () => {
	it('points at the reset-password page with the token in the query', () => {
		expect(buildResetPasswordUrl('https://diary.example.com', 'abc123')).toBe(
			'https://diary.example.com/reset-password?token=abc123'
		);
	});

	it('encodes the token', () => {
		const url = new URL(buildResetPasswordUrl('https://diary.example.com', 'a&b=c'));
		expect(url.searchParams.get('token')).toBe('a&b=c');
	});
});

describe('buildResetPasswordEmail', () => {
	const resetUrl = 'https://diary.example.com/reset-password?token=abc&x=1';

	it('escapes the user name and URL in the HTML body', () => {
		const email = buildResetPasswordEmail('<img src=x onerror=alert(1)>', resetUrl);
		expect(email.html).not.toContain('<img');
		expect(email.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
		expect(email.html).toContain(
			'href="https://diary.example.com/reset-password?token=abc&amp;x=1"'
		);
	});

	it('keeps the plain-text body unescaped', () => {
		const email = buildResetPasswordEmail('Tom & Jerry', resetUrl);
		expect(email.text).toContain('Hello Tom & Jerry,');
		expect(email.text).toContain(resetUrl);
	});

	it('falls back to a generic greeting without a name', () => {
		expect(buildResetPasswordEmail('', resetUrl).html).toContain('Hello there,');
		expect(buildResetPasswordEmail(null, resetUrl).text).toContain('Hello there,');
	});
});
