import { describe, expect, it } from 'vitest';
import { resolvePublicBaseUrl } from './base-url';

describe('resolvePublicBaseUrl', () => {
	const requestUrl = 'http://attacker.example/api/auth/request-password-reset';

	it('prefers BETTER_AUTH_URL over ORIGIN and the request', () => {
		expect(
			resolvePublicBaseUrl({
				betterAuthUrl: 'https://diary.example.com',
				origin: 'https://other.example.com',
				dev: false,
				requestUrl
			})
		).toBe('https://diary.example.com');
	});

	it('falls back to ORIGIN', () => {
		expect(
			resolvePublicBaseUrl({ origin: 'https://diary.example.com/', dev: false, requestUrl })
		).toBe('https://diary.example.com');
	});

	it('reduces a configured URL with a path to its origin', () => {
		expect(
			resolvePublicBaseUrl({ betterAuthUrl: 'https://diary.example.com/api/auth', dev: false })
		).toBe('https://diary.example.com');
	});

	it('never uses the request origin in production', () => {
		expect(resolvePublicBaseUrl({ dev: false, requestUrl })).toBeNull();
	});

	it('ignores invalid or non-http values', () => {
		expect(
			resolvePublicBaseUrl({ betterAuthUrl: 'not a url', origin: 'ftp://x.example', dev: false })
		).toBeNull();
		expect(resolvePublicBaseUrl({ betterAuthUrl: '  ', dev: false })).toBeNull();
	});

	it('uses the request origin in dev when nothing is configured', () => {
		expect(resolvePublicBaseUrl({ dev: true, requestUrl })).toBe('http://attacker.example');
	});

	it('returns null in dev without configuration or request', () => {
		expect(resolvePublicBaseUrl({ dev: true })).toBeNull();
	});
});
