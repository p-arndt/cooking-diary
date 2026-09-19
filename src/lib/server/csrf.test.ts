import { describe, expect, it } from 'vitest';
import {
	forbiddenCrossSiteResponse,
	isBearerOnlyRequest,
	isForbiddenCrossSiteRequest
} from './csrf';

const APP = 'https://diary.example';
const url = new URL(`${APP}/api/v1/files`);

function request(method: string, headers: Record<string, string> = {}): Request {
	return new Request(url, { method, headers });
}

const MULTIPART = 'multipart/form-data; boundary=----x';
const SESSION = 'better-auth.session_token=abc.def';

describe('isForbiddenCrossSiteRequest', () => {
	it('allows a same-origin form POST', () => {
		const req = request('POST', {
			'content-type': 'application/x-www-form-urlencoded',
			origin: APP,
			cookie: SESSION
		});
		expect(isForbiddenCrossSiteRequest(req, url)).toBe(false);
	});

	it('blocks a cross-origin form POST', () => {
		const req = request('POST', {
			'content-type': 'application/x-www-form-urlencoded',
			origin: 'https://evil.example',
			cookie: SESSION
		});
		expect(isForbiddenCrossSiteRequest(req, url)).toBe(true);
	});

	it('blocks a form POST without an Origin header', () => {
		const req = request('POST', { 'content-type': MULTIPART, cookie: SESSION });
		expect(isForbiddenCrossSiteRequest(req, url)).toBe(true);
	});

	it.each(['PUT', 'PATCH', 'DELETE'])('blocks cross-origin form %s requests', (method) => {
		const req = request(method, { 'content-type': MULTIPART, origin: 'https://evil.example' });
		expect(isForbiddenCrossSiteRequest(req, url)).toBe(true);
	});

	it.each([
		'text/plain',
		'TEXT/PLAIN; charset=utf-8',
		'multipart/form-data',
		'application/x-sveltekit-formdata'
	])('treats %s as a form content type', (contentType) => {
		const req = request('POST', { 'content-type': contentType, origin: 'https://evil.example' });
		expect(isForbiddenCrossSiteRequest(req, url)).toBe(true);
	});

	it('allows a cross-origin JSON POST, which needs a CORS preflight', () => {
		const req = request('POST', {
			'content-type': 'application/json',
			origin: 'https://evil.example',
			cookie: SESSION
		});
		expect(isForbiddenCrossSiteRequest(req, url)).toBe(false);
	});

	it('allows a POST without a content type', () => {
		expect(
			isForbiddenCrossSiteRequest(request('POST', { origin: 'https://evil.example' }), url)
		).toBe(false);
	});

	it.each(['GET', 'HEAD', 'OPTIONS'])('allows %s requests', (method) => {
		const req = request(method, { 'content-type': MULTIPART, origin: 'https://evil.example' });
		expect(isForbiddenCrossSiteRequest(req, url)).toBe(false);
	});

	it('allows a bearer multipart POST without Origin or cookie', () => {
		const req = request('POST', { 'content-type': MULTIPART, authorization: 'Bearer token123' });
		expect(isForbiddenCrossSiteRequest(req, url)).toBe(false);
	});

	it('allows a bearer multipart POST that only carries unrelated cookies', () => {
		const req = request('POST', {
			'content-type': MULTIPART,
			authorization: 'Bearer token123',
			cookie: 'PARAGLIDE_LOCALE=de'
		});
		expect(isForbiddenCrossSiteRequest(req, url)).toBe(false);
	});

	it.each([SESSION, `PARAGLIDE_LOCALE=de; __Secure-${SESSION}`])(
		'blocks a cross-origin bearer POST that also carries the session cookie (%s)',
		(cookie) => {
			const req = request('POST', {
				'content-type': MULTIPART,
				authorization: 'Bearer token123',
				origin: 'https://evil.example',
				cookie
			});
			expect(isForbiddenCrossSiteRequest(req, url)).toBe(true);
		}
	);

	it('does not treat other authorization schemes as bearer', () => {
		const req = request('POST', { 'content-type': MULTIPART, authorization: 'Basic dXNlcjpwdw==' });
		expect(isForbiddenCrossSiteRequest(req, url)).toBe(true);
	});

	it('allows trusted origins but never a missing origin', () => {
		const trusted = ['https://pay.example'];
		const fromTrusted = request('POST', {
			'content-type': MULTIPART,
			origin: 'https://pay.example'
		});
		expect(isForbiddenCrossSiteRequest(fromTrusted, url, trusted)).toBe(false);
		expect(
			isForbiddenCrossSiteRequest(request('POST', { 'content-type': MULTIPART }), url, trusted)
		).toBe(true);
	});
});

describe('isBearerOnlyRequest', () => {
	it('rejects an empty bearer token', () => {
		expect(isBearerOnlyRequest(request('POST', { authorization: 'Bearer ' }))).toBe(false);
	});

	it('accepts the scheme case-insensitively', () => {
		expect(isBearerOnlyRequest(request('POST', { authorization: 'bearer abc' }))).toBe(true);
	});

	it('does not mistake a similarly named cookie for the session cookie', () => {
		const req = request('POST', {
			authorization: 'Bearer abc',
			cookie: 'not-better-auth.session_token_x=1'
		});
		expect(isBearerOnlyRequest(req)).toBe(true);
	});
});

describe('forbiddenCrossSiteResponse', () => {
	it('answers JSON when the client asks for exactly application/json', async () => {
		const response = forbiddenCrossSiteResponse(request('POST', { accept: 'application/json' }));
		expect(response.status).toBe(403);
		expect(response.headers.get('content-type')).toBe('application/json');
		expect(await response.json()).toEqual({
			message: 'Cross-site POST form submissions are forbidden'
		});
	});

	it('answers plain text otherwise', async () => {
		const response = forbiddenCrossSiteResponse(
			request('DELETE', { accept: 'application/json, text/html' })
		);
		expect(response.status).toBe(403);
		expect(await response.text()).toBe('Cross-site DELETE form submissions are forbidden');
	});
});
