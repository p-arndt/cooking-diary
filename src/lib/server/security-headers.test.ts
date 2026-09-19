import { describe, expect, it } from 'vitest';
import {
	SECURITY_HEADERS,
	injectCspNonce,
	missingSecurityHeaders,
	withSecurityHeaders
} from './security-headers';

describe('missingSecurityHeaders', () => {
	it('returns every header for an empty response', () => {
		expect(Object.fromEntries(missingSecurityHeaders(new Headers()))).toEqual(SECURITY_HEADERS);
	});

	it('skips headers the response already set, case-insensitively', () => {
		const headers = new Headers({ 'x-frame-options': 'SAMEORIGIN' });
		expect(missingSecurityHeaders(headers).map(([name]) => name)).not.toContain('X-Frame-Options');
	});
});

describe('withSecurityHeaders', () => {
	it('adds the headers without overwriting existing ones', () => {
		const response = withSecurityHeaders(
			new Response('ok', { headers: { 'Referrer-Policy': 'no-referrer' } })
		);
		expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(response.headers.get('X-Frame-Options')).toBe('DENY');
		expect(response.headers.get('Permissions-Policy')).toBe(
			'camera=(), microphone=(), geolocation=()'
		);
	});

	it('copies responses whose headers are immutable', async () => {
		const response = withSecurityHeaders(Response.redirect('http://localhost/login', 302));
		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe('http://localhost/login');
		expect(response.headers.get('X-Frame-Options')).toBe('DENY');
	});
});

describe('injectCspNonce', () => {
	it('replaces the placeholder with the nonce of the SvelteKit bootstrap script', () => {
		const html =
			'<head><script nonce=%csp.nonce%>theme()</script></head>' +
			'<body><script nonce="abc+/12==">boot()</script></body>';
		expect(injectCspNonce(html)).toBe(
			'<head><script nonce="abc+/12==">theme()</script></head>' +
				'<body><script nonce="abc+/12==">boot()</script></body>'
		);
	});

	it('drops the placeholder when the page carries no nonce', () => {
		expect(injectCspNonce('<script nonce=%csp.nonce%>theme()</script>')).toBe(
			'<script >theme()</script>'
		);
	});

	it('leaves pages without the placeholder untouched', () => {
		const html = '<script nonce="abc">boot()</script>';
		expect(injectCspNonce(html)).toBe(html);
	});
});
