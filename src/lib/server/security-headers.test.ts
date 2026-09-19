import { error, redirect, type Cookies, type RequestEvent } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import {
	SECURITY_HEADERS,
	injectCspNonce,
	missingSecurityHeaders,
	securityHeadersHandle,
	withSecurityHeaders
} from './security-headers';

function fakeCookies(): Cookies {
	const serialize = (name: string, value: string, options: { path: string; maxAge?: number }) =>
		`${name}=${value}; Path=${options.path}` +
		(options.maxAge === undefined ? '' : `; Max-Age=${options.maxAge}`);
	return {
		get: () => undefined,
		getAll: () => [],
		set: () => {},
		delete: () => {},
		serialize
	};
}

type EventOptions = {
	method?: string;
	accept?: string;
	isDataRequest?: boolean;
};

function fakeEvent({ method = 'GET', accept, isDataRequest = false }: EventOptions = {}) {
	const request = new Request('http://localhost/', {
		method,
		headers: accept ? { accept } : {}
	});
	return {
		request,
		url: new URL(request.url),
		cookies: fakeCookies(),
		isDataRequest,
		isRemoteRequest: false
	} as unknown as RequestEvent;
}

async function handleWith(event: RequestEvent, resolve: (event: RequestEvent) => Response) {
	return securityHeadersHandle({
		event,
		resolve: async (e) => resolve(e)
	});
}

function expectSecurityHeaders(response: Response) {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		expect(response.headers.get(name)).toBe(value);
	}
}

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

describe('securityHeadersHandle', () => {
	it('adds the headers to resolved responses', async () => {
		const response = await handleWith(fakeEvent(), () => new Response('ok'));
		expect(await response.text()).toBe('ok');
		expectSecurityHeaders(response);
	});

	it('turns a redirect thrown by a later handle into a 3xx with the headers', async () => {
		const response = await handleWith(fakeEvent(), () => redirect(302, '/login'));
		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('/login');
		expectSecurityHeaders(response);
	});

	it('replays cookies written before the redirect', async () => {
		const event = fakeEvent();
		const response = await handleWith(event, (e) => {
			e.cookies.set('fresh', 'v', { path: '/' });
			e.cookies.delete('better-auth.session_token', { path: '/' });
			redirect(302, '/login');
		});
		expect(response.headers.getSetCookie()).toEqual([
			'fresh=v; Path=/',
			'better-auth.session_token=; Path=/; Max-Age=0'
		]);
	});

	it('answers data requests with the JSON redirect envelope', async () => {
		const response = await handleWith(fakeEvent({ isDataRequest: true }), () =>
			redirect(302, '/login')
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ type: 'redirect', location: '/login' });
		expectSecurityHeaders(response);
	});

	it('answers enhanced form actions with the action redirect envelope', async () => {
		const response = await handleWith(
			fakeEvent({ method: 'POST', accept: 'application/json' }),
			() => redirect(303, '/login')
		);
		expect(await response.json()).toEqual({ type: 'redirect', status: 303, location: '/login' });
		expectSecurityHeaders(response);
	});

	it('keeps a plain redirect for native form POSTs', async () => {
		const response = await handleWith(
			fakeEvent({ method: 'POST', accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }),
			() => redirect(303, '/login')
		);
		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe('/login');
	});

	it('turns a thrown HttpError into an error response with the headers', async () => {
		const response = await handleWith(fakeEvent({ accept: 'application/json' }), () =>
			error(418, 'Teapot')
		);
		expect(response.status).toBe(418);
		expect(await response.json()).toEqual({ message: 'Teapot' });
		expectSecurityHeaders(response);
	});

	it('turns an unexpected error into a 500 with the headers', async () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const response = await handleWith(fakeEvent({ accept: 'text/html' }), () => {
			throw new Error('database down');
		});
		expect(response.status).toBe(500);
		expect(await response.text()).toBe('Internal Error');
		expect(log).toHaveBeenCalled();
		expectSecurityHeaders(response);
		log.mockRestore();
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
